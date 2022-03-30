import { user, twoauth, waitingLogin } from '@lib/store'
import { get } from 'svelte/store'
import { goto } from '@sapper/app'

export const getCookiesFromString = s => s && Object.fromEntries(s.split?.('; ').map(v => v.split('=')))

export const getCookies = () => getCookiesFromString(document.cookie)

export const getCookieFromString = (s, key) => {
	let value = getCookiesFromString(s)?.[key]
	return (value && decodeURIComponent(value.split('.').slice(0, -1).join('.')))
}

export const getCookie = key => getCookieFromString(document.cookie, key)

export const removeCookie = key => (document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:01 GMT`)

export const clearCookies = () => {
	for (let key of Object.keys(getCookies()))
		removeCookie(key)
}

export const logIn = () => {
	waitingLogin.set(true)
	user.set(undefined)
	clearCookies()
	let treated = false
	window
		.open(`https://api.intra.42.fr/oauth/authorize?client_id=5fb8cff19443b1e91c5753666fdcb12d45ecbc49c667ba7eb97150cb2590b38a&redirect_uri=${encodeURIComponent(location.origin)}%2Fapi%2Fauth&response_type=code`, 'Auth 42', 'width=500,height=700')
		.onunload = () => {
			let update = () => {
				if (treated || getCookie('user') === undefined)
					return ;
				treated = true
				waitingLogin.set(false)
				if (getCookie('user') === '')
					get(twoauth).open()
				else if (getCookie('first_conn'))
				{
					removeCookie('first_conn')
					goto('/user')
				}
				else
					fetchUser()
			}
			for (let time of [10, 50, 100, 1000, 2000])
				setTimeout(update, time)
			setTimeout(() => waitingLogin.set(false), 2000)
		}
}
export const logOut = () => {
	user.set(undefined)
	localStorage.removeItem('user')
	clearCookies()
}

export const resolve = async (promise) => new Promise<any[]>(resolve =>
		promise
			.then(res => resolve([res, null]))
			.catch(err => resolve([null, err]))
	)

export const fetchUser = async (id = getCookie('user'), req = fetch) => {
	let noLogged = () => {
		user.set(undefined)
		if (typeof document !== 'undefined')
			localStorage.removeItem('user')
	}

	if (!id) return noLogged()
	const [res, ferr] = await resolve(req(`/api/users/${id}`))
	if (ferr || !res.ok) return noLogged()
	const [json, jerr] = await resolve(res.json())
	if (jerr) return noLogged()
	user.set(json)
	if (typeof document !== 'undefined')
		localStorage.setItem('user', JSON.stringify(json))
}

export const localStorageUser = () => {
	if (localStorage.getItem('user'))
		user.set(JSON.parse(localStorage.getItem('user')))
	else
		user.set(undefined)
}

if (typeof document !== 'undefined')
{
	if (getCookie('user'))
		localStorage.getItem('user')
			? localStorageUser()
			: fetchUser()
	else
	{
		user.set(undefined)
		localStorage.removeItem('user')
	}

	window.onstorage = localStorageUser
}