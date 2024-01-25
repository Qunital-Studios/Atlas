let currentPage = 'home';
let numberOfArtists, numberOfSongs;

// SETTING THE DEFAULT VOLUME OF THE AUDIO
document.getElementById('audioOutput').volume = 0.1;

function setOpenPage(cLink,pageToOpen){
    document.querySelector('.homePage').classList.add('displayNone');
    document.querySelector('.artistPage').classList.add('displayNone');
    document.querySelector('.favoritesPage').classList.add('displayNone');
    document.querySelector('.infoPage').classList.add('displayNone');
    document.querySelector('.settingsPage').classList.add('displayNone');

    let navLinks = document.querySelectorAll('.navLinks');
    navLinks.forEach((navLink) => {
        for (let i = 0; i < navLink.children.length; i++) {
            navLink.children[i].classList.remove('activeNav');
        }
    })
    cLink.classList.add('activeNav');
    document.querySelector(`.${pageToOpen}Page`).classList.remove('displayNone');
    currentPage = pageToOpen;
}

function scrollSection(divToScroll, isRight){
    if(isRight){
        document.querySelector(`.${divToScroll}`).scrollLeft += 200;
    }else{
        document.querySelector(`.${divToScroll}`).scrollLeft -= 200;
    }
}

function radioOnOff(status){
    let videos = document.querySelectorAll('.speaker');
    if(status){
        //pustitiradio bre
        setTimeout(() => {
            videos[0].children[0].play();
            videos[1].children[0].play();
        }, 200);
    }else{
        //zraustaviti radiobre
        setTimeout(() => {
            videos[0].children[0].pause();
            videos[1].children[0].pause();
        }, 400);
    }
}

//LOGIN SWITCH FORM
function switchForm(button, isLogIn){
    const loginForm = document.getElementById("loginForm").children;
    document.querySelector(".errorMessage").innerHTML="";
    if(isLogIn){
        button.parentElement.innerHTML=`Don't Have An Account?&nbsp;
        <span onclick="switchForm(this, false)"  class="highlightText">Register!</span>`;
        loginForm[0].innerHTML = "Log In";
        loginForm[1].children[1].disabled = true;
        loginForm[1].classList.add("displayNone");
        loginForm[6].children[1].classList.add("displayNone");
        loginForm[6].children[0].classList.remove("displayNone");
    }else{
        button.parentElement.innerHTML=`Already have An Account?&nbsp;
        <span onclick="switchForm(this, true)"  class="highlightText">Log In!</span>`;
        loginForm[0].innerHTML = "Register";
        loginForm[1].children[1].disabled = false;
        loginForm[1].classList.remove("displayNone");
        loginForm[6].children[1].classList.remove("displayNone");
        loginForm[6].children[0].classList.add("displayNone");
    }
}

// LOADER
function removeLoader(){
    setTimeout(() => {
        let loader = document.getElementById("loaderHolder");
        loader.classList.add("displayNone");
    }, 300);
}

function removeLoader2(loader){
    setTimeout(() => {
        loader.classList.add("displayNone");
    }, 200);
}

let searchText;

let searchInput = document.getElementById("searchInput");
document.addEventListener("mouseup", (e) => {
    if(e.target.id != "resultsHolder" && e.target.id != "searchInput" && e.target.id != "magnifier1" && e.target.id != "magnifier2" && e.target.className != "songClickDivHorizontal" && !e.target.className.includes("likeIcon")){
        searchInput.value = null;
        document.getElementById("resultsHolder").classList.add("displayNone");
    }else{
        searchText = null;
    }
})

function changeTheme(checkbox, parent){
    if(checkbox.checked){
        parent.className = null;
        parent.classList.add("notDefaultTheme");
        document.getElementById("currentTheme").innerHTML = "Light";

        document.documentElement.style.setProperty('--primary', '#dcdee3');
        document.documentElement.style.setProperty('--primarySeeThrough', 'rgba(87, 113, 179, 0.7)');
        document.documentElement.style.setProperty('--secondary', '#848b9c');
        document.documentElement.style.setProperty('--secondarySeeThrough', 'rgba(155, 169, 204 ,0.5)');
        document.documentElement.style.setProperty('--tertiary', '#6699ff');
        document.documentElement.style.setProperty('--secondaryContrast', '#3c4152');
        document.documentElement.style.setProperty('--secondaryContrastSeeThrough', 'rgba(48, 62, 105, 0.2)');
        document.documentElement.style.setProperty('--primaryContrast', 'rgb(33, 33, 33)');
        document.querySelector(".atlasLogo").src = "Images/AtlasLogobyDesignerDark.png"
        
    }else{
        parent.className = null;
        parent.classList.add("defaultTheme");
        document.getElementById("currentTheme").innerHTML = "Dark";

        document.documentElement.style.setProperty('--primary', '#181d24');
        document.documentElement.style.setProperty('--primarySeeThrough', 'rgba(24, 30, 37, 0.7)');
        document.documentElement.style.setProperty('--secondary', '#393e46');
        document.documentElement.style.setProperty('--secondarySeeThrough', 'rgba(57, 62, 70, 0.5)');
        document.documentElement.style.setProperty('--tertiary', '#00c3ff');
        document.documentElement.style.setProperty('--secondaryContrast', '#9da5bd');
        document.documentElement.style.setProperty('--secondaryContrastSeeThrough', 'rgba(157, 165, 189, 0.2)');
        document.documentElement.style.setProperty('--primaryContrast', '#eee');
        document.querySelector(".atlasLogo").src = "Images/AtlasLogobyDesignerLight.png"
    }
}

function setNumberOfLikedSongs(){
    let likedSongsHolder = document.querySelector('.likedSongsHolder').children;
    document.querySelector('.numberOfSongs').innerHTML = likedSongsHolder.length;
}