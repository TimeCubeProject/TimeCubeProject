let logout_btn = document.getElementById('logout-btn');
let refresh_btn = document.getElementById('refresh-window-btn')

logout_btn.addEventListener('click', () => {
  localStorage.removeItem('token')
  location.reload()
})

refresh_btn.addEventListener('click', () => {
  location.reload()
})
