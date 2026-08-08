const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  const formData = new FormData(form);
  const payload = new URLSearchParams();
  payload.append('email', formData.get('email'));
  payload.append('password', formData.get('password'));

  fetch('/login', { method: 'POST', body: payload })
    .then(function (resp) {
      // Le serveur répond 303 -> Location: /logs.
      // fetch ne suit pas automatiquement; on redirige manuellement.
      const dest = resp.headers.get('Location');
      window.location.href = dest || '/logs';
    })
    .catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Connexion';
      alert('Erreur réseau — réessayez ou utilisez le formulaire natif.');
    });
});
