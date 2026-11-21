import collections from './tracks.js';

const navigation = document.querySelector('#song-nav');
const lists = document.querySelector('#song-lists');
const player = document.querySelector('#audio');
const title = document.querySelector('#track-title');
const error = document.querySelector('#player-error');
let activeButton;

for (const [index, collection] of collections.entries()) {
  const section = document.createElement('section');
  section.className = 'song-collection';
  section.id = 'collection-' + (index + 1);
  const heading = document.createElement('h2');
  heading.textContent = collection.title;
  const link = document.createElement('a');
  link.href = '#' + section.id;
  link.textContent = collection.title;
  navigation.append(link);
  const tracks = document.createElement('ul');
  for (const track of collection.tracks) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.track = track.id;
    button.setAttribute('aria-pressed','false');
    button.textContent = track.title;
    item.append(button);
    tracks.append(item);
  }
  section.append(heading, tracks);
  lists.append(section);
}

lists.addEventListener('click', async event => {
  const button = event.target.closest('button[data-track]');
  if (!button) return;
  error.textContent = '';
  if (activeButton !== button) {
    activeButton?.setAttribute('aria-pressed','false');
    activeButton = button;
    button.setAttribute('aria-pressed','true');
    title.textContent = button.textContent;
    player.src = './audio/' + button.dataset.track + '.mp3';
  }
  try { await player.play(); }
  catch (failure) {
    if (activeButton === button && failure.name !== 'AbortError') error.textContent = 'Не удалось начать воспроизведение. Попробуйте ещё раз.';
  }
});
