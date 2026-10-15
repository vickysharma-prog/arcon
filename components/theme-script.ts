// Runs before paint so a saved or requested theme shows without a flash. `?theme=light|dark` sets and saves it.
export const THEME_SCRIPT = `try{var q=new URLSearchParams(location.search).get("theme");if(q==="light"||q==="dark")localStorage.setItem("arcon-theme",q);var t=localStorage.getItem("arcon-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

// Chrome offers to install the app very early in the page's life, before React is listening: keep the offer so the
// "Install app" button can use it once it mounts.
export const INSTALL_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__arconInstall=e;window.dispatchEvent(new Event("arcon-installable"))});`;
