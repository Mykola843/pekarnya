(() => {
     'use strict'; const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s); const config=window.SC_CONFIG|| {
    }; const ready=!!(config.url&&config.anonKey&&window.supabase); const db=ready?window.supabase.createClient(config.url,config.anonKey):null; let user=null,staff=false,cart=[]; const products=[ {
        id:1,name:'Шаурма',price:130
    }, {
        id:2,name:'Хот-дог',price:100
    }, {
        id:3,name:'Чіабата',price:100
    }, {
        id:4,name:'Бургер',price:100
    }]; const toast=s=>{
        const el=$('#toast');el.textContent=s;el.style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.style.display='none',4000)
    }; const message=e=>e?.message||'Сталася помилка'; function show(id) {
        document.getElementById(id).showModal()
    } $$('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close()); $('#year').textContent=new Date().getFullYear(); const burger=$('#burger'),nav=$('#nav');burger.onclick=()=>{
        const open=nav.classList.toggle('open');burger.textContent=open?'✕':'☰';burger.setAttribute('aria-expanded',String(open))
    }; nav.querySelectorAll('a').forEach(a=>a.onclick=()=>{
        nav.classList.remove('open');burger.textContent='☰'
    }); $$('.filter').forEach(b=>b.onclick=()=>{
        $$('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.item').forEach(c=>c.hidden=b.dataset.filter!=='all'&&c.dataset.category!==b.dataset.filter)
    }); function renderCart() {
        const el=$('#cartItems');el.replaceChildren();if(!cart.length)el.textContent='Кошик порожній.'; cart.forEach((x,i)=>{
            const row=document.createElement('div');row.className='cart-row';const label=document.createElement('span');label.textContent=x.name+' · '+x.price+' грн';const controls=document.createElement('span');for(const [sign,delta] of [['−',-1],['+',1]]) {
                const b=document.createElement('button');b.textContent=sign;b.onclick=()=>{
                    x.qty+=delta;if(x.qty<=0)cart.splice(i,1);renderCart()
                };controls.append(b);if(delta===-1) {
                    const q=document.createElement('span');q.textContent=x.qty;controls.append(q)
                }
            }
            row.append(label,controls);el.append(row)
        }); const sum=cart.reduce((s,x)=>s+x.price*x.qty,0);$('#cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);$('#subtotal').textContent=sum+' грн';$('#discount').textContent='0 грн';$('#total').textContent=sum+' грн';$('#usePoints').checked=false;$('#usePoints').disabled=true
    } $$('.add').forEach(b=>b.onclick=()=>{
        const p=products[Number(b.dataset.id)];const existing=cart.find(x=>x.id===p.id);if(existing)existing.qty++;else cart.push({
            ...p,qty:1
        });renderCart();toast('Додано: '+p.name)
    }); $('#pastryAdd').onclick=()=>toast('Для цього товару власник пекарні ще має підтвердити ціну.'); $('#cartOpen').onclick=$('#heroOrder').onclick=()=>{
        renderCart();show('cartDialog')
    }; $('#profileOpen').onclick=()=>{
        show('profileDialog');if(user)loadAccount()
    }; $('#adminOpen').onclick=()=>{
        show('adminDialog');loadAdmin()
    }; $('#refreshAdmin').onclick=loadAdmin; async function refreshSession() {
        if(!db)return;const {
            data: {
                user:u
            }
        }
        =await db.auth.getUser();user=u;$('#authForms').hidden=!!user;$('#accountInfo').hidden=!user;$('#adminOpen').hidden=true;staff=false; if(user) {
            const {
                data
            }
            =await db.from('staff').select('user_id').eq('user_id',user.id).maybeSingle();staff=!!data;$('#adminOpen').hidden=!staff;await loadAccount()
        }
    } async function loadAccount() {
        if(!user)return;const [ {
            data:p,error:e
        }, {
            data:orders
        }]=await Promise.all([db.from('profiles').select('display_name,points').eq('id',user.id).single(),db.from('orders').select('id,status,total_uah,created_at').order('created_at', {
            ascending:false
        }).limit(30)]); if(e)toast(message(e));$('#accountName').textContent=p?.display_name||user.email;$('#accountPoints').textContent=p?.points??0; const target=$('#accountOrders');target.replaceChildren();if(!orders?.length)target.textContent='Замовлень ще немає.'; (orders||[]).forEach(o=>{
            const d=document.createElement('div');d.className='history-row';d.textContent=new Date(o.created_at).toLocaleDateString('uk-UA')+' · '+o.total_uah+' грн · '+o.status+' · '+o.id.slice(0,8);target.append(d)
        })
    } async function auth(mode) {
        if(!db)return toast('Спочатку налаштуйте Supabase у config.js');const email=$('#authEmail').value.trim(),password=$('#authPassword').value,name=$('#authName').value.trim();if(!email||password.length<8)return toast('Вкажіть email і пароль від 8 символів'); const res=mode==='up'?await db.auth.signUp({
            email,password,options: {
                data: {
                    name
                }
            }
        }):await db.auth.signInWithPassword({
            email,password
        });if(res.error)return toast(message(res.error));await refreshSession();toast(mode==='up'?'Перевірте пошту для підтвердження реєстрації':'Вхід виконано')
    } $('#signIn').onclick=()=>auth('in');$('#signUp').onclick=()=>auth('up');$('#signOut').onclick=async()=>{
        await db.auth.signOut();user=null;staff=false;$('#authForms').hidden=false;$('#accountInfo').hidden=true;$('#adminOpen').hidden=true;toast('Ви вийшли з акаунта')
    }; $('#checkout').onclick=async()=>{
        if(!ready)return toast('Налаштуйте Supabase у config.js');if(!user) {
            $('#cartDialog').close();show('profileDialog');return toast('Увійдіть для оформлення замовлення')
        };if(!cart.length)return toast('Кошик порожній'); const {
            data,error
        }
        =await db.functions.invoke('create-order', {
            body: {
                items:cart.map(x=>({
                    id:x.id,quantity:x.qty
                }))
            }
        });if(error||data?.error)return toast('Не вдалося створити замовлення: '+message(error||data.error));cart=[];renderCart();$('#cartDialog').close();toast('Замовлення '+data.orderId.slice(0,8)+' створено. Оплата LiqPay поки не підключена.');await loadAccount()
    }; async function loadAdmin() {
        if(!staff)return;const target=$('#adminOrders');target.textContent='Завантаження…';const {
            data,error
        }
        =await db.from('orders').select('id,status,total_uah,created_at,profiles(display_name)').order('created_at', {
            ascending:false
        }).limit(60); if(error) {
            target.textContent=message(error);return
        }
        target.replaceChildren();if(!data.length)target.textContent='Замовлень ще немає.'; for(const o of data) {
            const row=document.createElement('div');row.className='admin-row';const info=document.createElement('div');info.textContent=`${new Date(o.created_at).toLocaleString('uk-UA')} · ${o.profiles?.display_name||'Клієнт'} · ${o.total_uah} грн · ${o.id.slice(0,8)}`;const select=document.createElement('select');for(const [v,t] of [['awaiting_payment','Очікує оплати'],['preparing','Готується'],['ready','Готове'],['completed','Видано'],['cancelled','Скасовано']]) {
                const opt=document.createElement('option');opt.value=v;opt.textContent=t;select.append(opt)
            }
            select.value=o.status;select.disabled=['paid'].includes(o.status);const button=document.createElement('button');button.className='small-btn';button.textContent='Зберегти';button.onclick=async()=>{
                button.disabled=true;const {
                    error:e
                }
                =await db.rpc('staff_update_order_status', {
                    p_order:o.id,p_status:select.value
                });button.disabled=false;if(e)toast(message(e));else {
                    toast('Статус оновлено');loadAdmin()
                }
            };row.append(info,select,button);target.append(row)
        }
    } if(!ready) {
        $('#checkout').disabled=true;toast('Режим налаштування: введіть URL та anon key Supabase у config.js')
    }
    else {
        db.auth.onAuthStateChange(()=>setTimeout(refreshSession,0));refreshSession()
    } renderCart();
})();
