const TOKEN_KEY = 'oceanic_auth_token'
const USERS_KEY = 'oceanic_users'
const CURRENT_USER_KEY = 'oceanic_current_user'

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || [] } catch { return [] }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function validateEmail(email) {
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email)
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY)) && Boolean(localStorage.getItem(CURRENT_USER_KEY))
}

export function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) } catch { return null }
}

export function login({ email, password }) {
  if (!email || !password) throw new Error('Email and password are required')
  if (!validateEmail(email)) throw new Error('Enter a valid email')
  const users = readUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw new Error('No account found for this email')
  if (user.password !== password) throw new Error('Incorrect password')
  localStorage.setItem(TOKEN_KEY, `token-${Date.now()}`)
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name: user.name, email: user.email }))
}

export function signup({ name, email, password }) {
  if (!name || !email || !password) throw new Error('All fields are required')
  if (!validateEmail(email)) throw new Error('Enter a valid email')
  if (password.length < 6) throw new Error('Password must be at least 6 characters')
  const users = readUsers()
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already registered')
  }
  const newUser = { name, email, password }
  users.push(newUser)
  writeUsers(users)
  localStorage.setItem(TOKEN_KEY, `token-${Date.now()}`)
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ name, email }))
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)
}


