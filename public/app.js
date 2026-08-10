const form = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

function validate() {
  submitBtn.disabled = !(emailInput.value.trim() && passwordInput.value.trim());
}

emailInput.addEventListener('input', validate);
passwordInput.addEventListener('input', validate);
validate();

form.addEventListener('submit', function (e) {
  if (submitBtn.disabled) {
    e.preventDefault();
    return;
  }
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours…';

  const formData = new FormData(form);
  const payload = new URLSearchParams();
  payload.append('email', formData.get('email'));
  payload.append('password', formData.get('password'));

  fetch('/login', { method: 'POST', body: payload })
    .then(function (resp) {
      const dest = resp.headers.get('Location');
      window.location.href = dest || '/logs';
    })
    .catch(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Suivant';
      alert('Erreur réseau — réessayez ou utilisez le formulaire natif.');
    });
});
