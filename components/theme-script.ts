// Runs before paint so a saved or requested theme shows without a flash. `?theme=light|dark` sets and saves it.
export const THEME_SCRIPT = `try{var q=new URLSearchParams(location.search).get("theme");if(q==="light"||q==="dark")localStorage.setItem("arcon-theme",q);var t=localStorage.getItem("arcon-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
