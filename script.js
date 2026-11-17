const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
 const burger=$('#burger'),nav=$('#nav');
burger.addEventListener('click',()=>{
    let open=nav.classList.toggle('open');burger.setAttribute('aria-expanded',String(open));burger.textContent=open?'✕':'☰'
});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    nav.classList.remove('open');burger.setAttribute('aria-expanded','false');burger.textContent='☰'
}));
 $$('.filter').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$$('.item').forEach(card=>card.hidden=btn.dataset.filter!=='all'&&card.dataset.category!==btn.dataset.filter)
}));
$('#year').textContent=new Date().getFullYear();
 const products=[ {
    name:'Шаурма',price:130
}, {
    name:'Хот-дог',price:100
}, {
    name:'Чіабата',price:100
}, {
    name:'Бургер',price:100
}];
 const get=(key,fallback)=>{
    try {
        return JSON.parse(localStorage.getItem(key))??fallback
    }
    catch {
        return fallback
    }
};
let cart=get('sc_cart',[]),profile=get('sc_profile',null);
const save=()=>{
    localStorage.setItem('sc_cart',JSON.stringify(cart));
    if(profile)localStorage.setItem('sc_profile',JSON.stringify(profile));
    else localStorage.removeItem('sc_profile')
};
 function toast(s) {
    const el=$('#toast');
    el.textContent=s;
    el.style.display='block';
    clearTimeout(window.toastTimer);
    window.toastTimer=setTimeout(()=>el.style.display='none',3000)
} function add(name,price) {
    const row=cart.find(x=>x.name===name);
    if(row)row.qty++;
    else cart.push({
        name,price,qty:1
    });
    save();
    renderCart();
    toast(name+' додано до кошика')
} $$('.add').forEach(b=>b.addEventListener('click',()=>{
    let x=products[+b.dataset.id];add(x.name,x.price)
}));
$('#pastryAdd').addEventListener('click',()=>{
    const name=$('#pastry').value;if(!name) {
        toast('Спочатку оберіть вид випічки');return
    }
    toast('Ціну «'+name+'» потрібно уточнити. Додати до суми поки неможливо.')
});
 function subtotal() {
    return cart.reduce((s,x)=>s+x.price*x.qty,0)
}
function discount() {
    return profile&&$('#usePoints').checked?Math.min(profile.points,Math.floor(subtotal()*.2)):0
} function renderCart() {
    $('#cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);
    $('#cartItems').replaceChildren();
    if(!cart.length) {
        $('#cartItems').textContent='Кошик порожній. Оберіть страви в меню.'
    }
    cart.forEach((x,i)=>{
        const d=document.createElement('div');d.className='cart-row';const t=document.createElement('span');t.textContent=x.name+' · '+x.price+' грн';const controls=document.createElement('span');const minus=document.createElement('button');minus.textContent='−';minus.setAttribute('aria-label','Зменшити кількість '+x.name);minus.onclick=()=>{
            x.qty--;if(!x.qty)cart.splice(i,1);save();renderCart()
        };const qty=document.createElement('span');qty.textContent=x.qty;const plus=document.createElement('button');plus.textContent='+';plus.setAttribute('aria-label','Збільшити кількість '+x.name);plus.onclick=()=>{
            x.qty++;save();renderCart()
        };controls.append(minus,qty,plus);d.append(t,controls);$('#cartItems').append(d)
    });
    $('#subtotal').textContent=subtotal()+' грн';
    $('#discount').textContent=discount()+' грн';
    $('#total').textContent=(subtotal()-discount())+' грн';
    $('#usePoints').disabled=!profile||!profile.points
} $('#usePoints').addEventListener('change',renderCart);
function openDialog(id) {
    renderCart();
    renderProfile();
    $('#'+id).showModal()
}
$('#cartOpen').onclick=()=>openDialog('cartDialog');
$('#heroOrder').onclick=()=>openDialog('cartDialog');
$('#profileOpen').onclick=()=>openDialog('profileDialog');
$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());
 function renderProfile() {
    const active=!!profile;
    $('#profileSetup').hidden=active;
    $('#profileInfo').hidden=!active;
    if(!active)return;
    $('#displayName').textContent=profile.name;
    $('#pointsValue').textContent=profile.points;
    $('#history').replaceChildren();
    if(!profile.history.length)$('#history').textContent='Поки немає замовлень.';
    profile.history.slice().reverse().forEach(h=>{
        const div=document.createElement('div');div.className='history-row';div.textContent=h.date+' · '+h.total+' грн · +'+h.earned+' балів';$('#history').append(div)
    })
} $('#saveProfile').onclick=()=>{
    const name=$('#profileName').value.trim();
    if(name.length<2) {
        toast('Введіть ім’я (мінімум 2 символи)');
        return
    }
    profile={
        name,points:0,history:[]
    };
    save();
    renderProfile();
    toast('Демонстраційний профіль створено')
};
$('#logout').onclick=()=>{
    if(!confirm('Видалити локальний профіль та накопичені бали?'))return;
    profile=null;
    save();
    $('#usePoints').checked=false;
    renderProfile();
    renderCart()
};
 $('#checkout').onclick=()=>{
    if(!cart.length) {
        toast('Спочатку додайте страви до кошика');
        return
    }
    if(!profile) {
        $('#cartDialog').close();
        openDialog('profileDialog');
        toast('Для нарахування балів створіть профіль');
        return
    }
    const used=discount(),total=subtotal()-used,earned=Math.floor(total/10);
    profile.points=profile.points-used+earned;
    profile.history.push({
        date:new Date().toLocaleDateString('uk-UA'),total,earned
    });
    cart=[];
    $('#usePoints').checked=false;
    save();
    renderCart();
    renderProfile();
    $('#cartDialog').close();
    toast('Демонстраційне замовлення завершено! +'+earned+' балів. Реальне замовлення не надіслано.')
};
renderCart();
