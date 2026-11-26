const games = [
  {id:'neon-frontier', title:'Неоновый рубеж', platform:'PC+VR', genre:'Тир · 1–2 игрока', art:'neon-frontier-art', price:300, url:'./neon-frontier.html', teaser:'Боевые дроны из портала, два оружия и соревнование вдвоём. Полная версия 0.6.0 для Windows.'},
  {id:'bulgar', title:'Хроники Булгара', platform:'PC', genre:'Приключение', art:'fortress', price:1290, teaser:'Путешествие вдоль Волги к тайнам древней крепости.', description:'Исследуйте прибрежные поселения и крепостные башни. По следам пропавшего картографа предстоит собрать историю города из записей, находок и рассказов его жителей.'},
  {id:'moon', title:'Лунный рубеж', platform:'VR', genre:'Научная фантастика', art:'moon', price:1490, teaser:'Один астронавт и станция, потерявшая связь с Землёй.', description:'Войдите в заброшенный лунный комплекс, восстановите питание и выясните, почему экипаж оставил станцию. Взаимодействие с панелями и инструментами задумано для VR.'},
  {id:'forest', title:'Тропа янтаря', platform:'PC', genre:'Головоломка', art:'forest', price:890, teaser:'Лесные тропы, каменные арки и загадки старого святилища.', description:'Наблюдайте за тем, как свет меняет лес, и открывайте новые пути между каменными руинами. В основе концепта — пространственные головоломки и неспешное исследование.'},
  {id:'race', title:'Неоновый вираж', platform:'VR', genre:'Гонки', art:'racer', price:1090, teaser:'Гонки над городом на машинах с антигравитацией.', description:'Пройдите трассы между башнями ночного города. Выбирайте траектории, берегите заряд ускорителя и улучшайте время круга.'}
];
const money = new Intl.NumberFormat('ru-RU', {style:'currency', currency:'RUB', maximumFractionDigits:0});
const products = document.querySelector('#products');
const dialog = document.querySelector('#dialog');
const title = document.querySelector('#dialog-title');
const body = document.querySelector('#dialog-body');
const status = document.querySelector('#status');
const cart = new Set();
try {
  const stored = JSON.parse(localStorage.getItem('bulgar-cart'));
  if (Array.isArray(stored)) games.filter(game => stored.includes(game.id)).forEach(game => cart.add(game.id));
} catch {}
function updateCart() {
  document.querySelector('#count').textContent = cart.size;
  try { localStorage.setItem('bulgar-cart', JSON.stringify([...cart])); } catch {}
}
function platform(game) { return game.platform === 'PC+VR' ? 'ПК + VR' : game.platform === 'PC' ? 'ПК' : 'VR'; }
function displayGames(filter) {
  products.innerHTML = games.filter(game => filter === 'all' || game.platform === filter || game.platform === 'PC+VR').map(game =>
    `<article class="card"><div class="art ${game.art}" aria-hidden="true"></div><div class="card-content"><p class="meta">${platform(game)} · ${game.genre}</p><h3>${game.title}</h3><p>${game.teaser}</p><div class="card-bottom"><strong class="price">${money.format(game.price)}</strong><button class="secondary" data-game="${game.id}" aria-label="Подробнее об игре ${game.title}">Подробнее</button></div></div></article>`
  ).join('');
}
function openPanel(heading, content) {
  title.textContent = heading;
  body.innerHTML = content;
  if (!dialog.open) dialog.showModal();
}
function showGame(game) {
  if(game.url){location.href=game.url;return;}
  const added = cart.has(game.id);
  openPanel(game.title, `<div class="art dialog-art ${game.art}" aria-hidden="true"></div><p class="meta">${platform(game)} · ${game.genre} · Игровой концепт</p><p class="dialog-copy">${game.description}</p><div class="card-bottom"><strong>${money.format(game.price)}</strong><button class="primary" ${added ? 'data-action="cart"' : 'data-add="' + game.id + '"'}>${added ? 'Открыть корзину' : 'В корзину'}</button></div>`);
  body.querySelector('button').focus();
}
function showCart() {
  const items = games.filter(game => cart.has(game.id));
  const total = items.reduce((sum, game) => sum + game.price, 0);
  openPanel('Корзина', items.length ? `<p class="dialog-copy">Демонстрационный заказ. Оплата и выдача игр отключены.</p>${items.map(game => `<div class="line"><div><strong>${game.title}</strong><small>${money.format(game.price)}</small></div><button class="secondary" data-remove="${game.id}" aria-label="Убрать из корзины ${game.title}">Убрать</button></div>`).join('')}<div class="total"><strong>Итого</strong><strong>${money.format(total)}</strong></div><button class="primary" data-action="checkout">Оформить демозаказ</button>` : '<p class="dialog-copy">Корзина пуста.</p><button class="primary" data-action="browse">Вернуться к играм</button>');
  body.querySelector('button').focus();
}
document.querySelector('.filters').addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', item === button));
  displayGames(button.dataset.filter);
});
products.addEventListener('click', event => {
  const id = event.target.closest('[data-game]')?.dataset.game;
  if (id) showGame(games.find(game => game.id === id));
});
document.querySelector('#cart').addEventListener('click', showCart);
body.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  const {add, remove, action} = button.dataset;
  if (add) {
    const game = games.find(item => item.id === add);
    cart.add(add);
    updateCart();
    showGame(game);
    status.textContent = `${game.title} добавлена в корзину`;
  } else if (remove) {
    cart.delete(remove);
    updateCart();
    showCart();
  } else if (action === 'cart') {
    showCart();
  } else if (action === 'checkout' && cart.size) {
    cart.clear();
    updateCart();
    openPanel('Демозаказ оформлен', '<p class="dialog-copy">Демонстрационное оформление завершено. Платёж не списывался.</p><button class="primary" data-action="browse">Вернуться к играм</button>');
    body.querySelector('button').focus();
  } else if (action === 'browse') {
    dialog.close();
    document.querySelector('[data-filter][aria-pressed="true"]').focus();
  }
});
updateCart();
displayGames('all');

