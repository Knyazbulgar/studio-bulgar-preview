const players = [...document.querySelectorAll('video')];
for (const player of players) {
  player.addEventListener('play', () => {
    for (const other of players) {
      if (other !== player && !other.paused) other.pause();
    }
  });
}
