(() => {
  'use strict';
  const backend='https://studio-bulgar.neighborlygrain.chatgpt.site';
  const test=location.origin===backend&&location.pathname==='/shop/test';
  const endpoint=backend+'/api/shop/'+(test?'test/':'');
  const key='bulgar-purchase-neon-v1'+(test?'-test':'');
  const $=id=>document.getElementById(id);
  let config,order,widget,poll,busy=false;
  const valid=o=>o&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(o.id)&&/^[a-f0-9]{64}$/.test(o.access);
  function message(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  function remember(){try{sessionStorage.setItem(key,JSON.stringify(order));}catch{}showRecord();}
  function showRecord(){
    $('order-record').hidden=!order;
    if(order){$('order-number').textContent='Заказ № '+order.id;location.hash=new URLSearchParams({order:order.id,access:order.access}).toString();}
  }
  async function request(route,options={}){
    const headers={...options.headers};if(order)headers.Authorization='Bearer '+order.access;
    const response=await fetch(endpoint+route,{...options,headers,cache:'no-store'});
    const body=await response.json();if(!response.ok)throw Error(body.error||'Сервис временно недоступен.');return body;
  }
  function display(result){
    if(result.state==='paid'){
      clearTimeout(poll);if(widget){widget.destroy();widget=null;}
      $('checkout-form').hidden=true;$('check').hidden=true;$('paid').hidden=false;
      $('license-key').textContent=result.license.key;
      $('download-quota').textContent='Осталось загрузок: '+result.license.downloadsRemaining+' из 3.';
      $('download').disabled=result.license.downloadsRemaining===0;
      $('license-devices').replaceChildren();
      if(!result.license.devices.length)$('license-devices').textContent='Компьютеры пока не активированы. Введите ключ при первом запуске игры.';
      for(const device of result.license.devices){
        const row=document.createElement('div');row.className='license-device';
        const name=document.createElement('span');name.textContent=device.label;
        const button=document.createElement('button');button.type='button';button.className='secondary';button.textContent='Снять активацию';
        button.addEventListener('click',async()=>{if(!window.confirm('Снять активацию с компьютера «'+device.label+'»? Игра на нём приостановится.'))return;button.disabled=true;try{display(await request('orders/'+order.id+'/revoke',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({deviceId:device.id})}));}catch(e){message(e.message,true);button.disabled=false;}});
        row.append(name,button);$('license-devices').append(row);
      }
      message(test?'Тестовый платёж подтверждён сервером.':'Оплата подтверждена. Сохраните ключ и ссылку на заказ.');
      return true;
    }
    if(result.state==='canceled'||result.state==='refunded'){
      clearTimeout(poll);if(widget){widget.destroy();widget=null;}
      $('paid').hidden=true;$('checkout-form').hidden=true;$('new-order').hidden=false;
      message(result.state==='refunded'?'Платёж возвращён. Скачивание недоступно.':'Платёж отменён. Можно создать новый заказ.',true);return true;
    }
    return false;
  }
  async function check(){
    if(!order)return;
    try{if(display(await request('orders/'+order.id)))return;message('Ожидаем подтверждение оплаты…');}
    catch(error){message(error.message,true);}
    clearTimeout(poll);poll=setTimeout(check,5000);
  }
  async function library(){
    if(window.YooMoneyCheckoutWidget)return;
    await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://yookassa.ru/checkout-widget/v1/checkout-widget.js';script.onload=resolve;script.onerror=()=>reject(Error('Не удалось загрузить платёжную форму ЮKassa.'));document.head.append(script);});
  }
  async function start(event){
    event.preventDefault();if(busy)return;if(!$('terms-accept').checked){message('Прочитайте и примите условия оферты.',true);return;}busy=true;$('pay').disabled=true;
    try{
      if(!order){order={id:crypto.randomUUID(),access:Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('')};remember();}
      message('Готовим платёжную форму…');
      const result=await request('checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...order,email:$('receipt-email').value,termsAccepted:$('terms-accept').checked,termsVersion:'2026-11-26.2'})});
      if(display(result))return;
      await library();if(widget)widget.destroy();
      widget=new window.YooMoneyCheckoutWidget({confirmation_token:result.confirmationToken,return_url:location.href,
        error_callback:()=>{message('Платёжная форма недоступна. Проверь статус заказа перед повторной попыткой.',true);$('check').hidden=false;}});
      widget.render('payment-form');$('checkout-form').hidden=true;$('check').hidden=false;
      message(test?'Используй тестовую карту ЮKassa. Деньги не списываются.':'Выбери способ оплаты в защищённой форме ЮKassa.');
      clearTimeout(poll);poll=setTimeout(check,5000);
    }catch(error){message(error.message,true);$('check').hidden=!order;}
    finally{busy=false;$('pay').disabled=false;}
  }
  $('copy-key').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('license-key').textContent);message('Ключ скопирован.');}catch{message('Выделите и скопируйте ключ вручную.');}});
  $('download').addEventListener('click',async()=>{
    if(busy)return;busy=true;$('download').disabled=true;
    const downloadKey=key+'-download-'+order.id;
    let requestId;try{requestId=sessionStorage.getItem(downloadKey);}catch{}
    if(!requestId){requestId=crypto.randomUUID();try{sessionStorage.setItem(downloadKey,requestId);}catch{}}
    try{
      const result=await request('orders/'+order.id+'/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId})});
      const url=new URL(result.downloadUrl);if(url.origin!==backend||url.pathname!=='/shop/download')throw Error('Некорректная ссылка на игру.');
      const link=document.createElement('a');link.href=url.href;link.referrerPolicy='no-referrer';link.download='';document.body.append(link);link.click();link.remove();
      try{sessionStorage.removeItem(downloadKey);}catch{}
      await check();message('Загрузка начата. Если она прервётся, продолжите её в загрузках браузера.');
    }catch(e){message(e.message,true);$('download').disabled=false;}
    finally{busy=false;}
  });
  $('checkout-form').addEventListener('submit',start);
  $('check').addEventListener('click',check);
  $('new-order').addEventListener('click',()=>{clearTimeout(poll);order=null;try{sessionStorage.removeItem(key);}catch{}location.hash='';location.reload();});
  $('save-order').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.href);message('Ссылка на заказ скопирована.');}catch{message('Скопируй адрес этой страницы из адресной строки браузера.');}});
  async function boot(){
    const fragment=new URLSearchParams(location.hash.slice(1));const fromUrl={id:fragment.get('order'),access:fragment.get('access')};
    if(valid(fromUrl))order=fromUrl;else{try{const stored=JSON.parse(sessionStorage.getItem(key));if(valid(stored))order=stored;}catch{}}
    if(order)remember();
    $('test-notice').hidden=!test;
    try{
      config=await request('config');
      if(order){$('check').hidden=false;await check();}
      if(!config.enabled){if(!order)message('Приём настоящих платежей ещё не активирован. Деньги не списываются. Покупка станет доступна после подключения магазина.',false);return;}
      $('receipt-field').hidden=!config.receiptEmailRequired;$('receipt-email').required=config.receiptEmailRequired;
      if(!order){$('checkout-form').hidden=false;message(test?'Тестовый магазин готов.':'Оплати 300 ₽ и получи игру на этой странице.');}
      else if($('paid').hidden&&$('new-order').hidden){$('checkout-form').hidden=false;}
    }catch(error){message(error.message,true);}
  }
  boot();
})();
