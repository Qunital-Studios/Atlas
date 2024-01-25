// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";
import { } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js';
import { getDatabase, ref, set, child, get, update, remove, onValue, query, orderByChild} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';
import { getAuth, signInWithRedirect, signInWithPopup, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCau-43YFiKEoph3GYudKguLPJ6SlAx1gU",
  authDomain: "atlas-44e76.firebaseapp.com",
  databaseURL: "https://atlas-44e76-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "atlas-44e76",
  storageBucket: "atlas-44e76.appspot.com",
  messagingSenderId: "762107217664",
  appId: "1:762107217664:web:a7ccb84eab22b1af76d5e5",
  measurementId: "G-K88WD6CL5F"
};

// Initialize Firebase
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const provider = new GoogleAuthProvider();
const db=getDatabase();
let dbRef = ref(db);
const storage=getStorage();

let currentUserUID;

// LOGIN / REGISTER
const loginForm = document.getElementById('loginForm');
loginForm.onsubmit = (e) => {
  e.preventDefault();
}

const registerBtn = document.getElementById("registerBtn");
registerBtn.addEventListener("click", () =>{
  createUserWithEmailAndPassword(auth, document.getElementById("emailInput").value, document.getElementById("passwordInput").value)
  .then((credentials)=>{
    document.getElementById("logInBtn").click();
  })
  .catch((error)=>{
    let errorMessage=error.message.split('auth/')[1];
    errorMessage=errorMessage.slice(0,errorMessage.length-2);
    document.querySelector(".errorMessage").innerHTML=errorMessage.split('-').join(' ');
  })
})

const logInBtn = document.getElementById("logInBtn");
logInBtn.addEventListener("click", () =>{
  signInWithEmailAndPassword(auth, document.getElementById("emailInput").value, document.getElementById("passwordInput").value)
  .then((credentials)=>{
    document.querySelector(".loginScreen").classList.add("displayNone");
  })
  .catch((error)=>{
    let errorMessage=error.message.split('auth/')[1];
    errorMessage=errorMessage.slice(0,errorMessage.length-2);
    document.querySelector(".errorMessage").innerHTML=errorMessage.split('-').join(' ');
  })
})

const signInGoogleBtn = document.getElementById('signInGoogleBtn');
const googleSignOutBtn = document.getElementById('googleSignOutBtn');

const googleUserSignIn = async() => {
  signInWithPopup(auth, provider)
  .then((result) => {
    const user = result.user;
    document.querySelector(".loginScreen").classList.add("displayNone");
  }).catch((error) => {
    let errorMessage=error.message.split('auth/')[1];
    errorMessage=errorMessage.slice(0,errorMessage.length-2);
    document.querySelector(".errorMessage").innerHTML=errorMessage.split('-').join(' ');
  })
}

let audioOutput = document.getElementById('audioOutput');
const googleUserSignOut = async() => {
  signOut(auth)
  .then(() => {
    audioOutput.pause();
    document.querySelector(".loginScreen").classList.remove("displayNone");
    alert("You have signed out!");
  })
  .catch((error) => {
    console.log(error.message);
  })
}

let userAccType = "User";
onAuthStateChanged(auth, async(user) => {
  document.getElementById("loaderHolder").classList.remove("displayNone");
  if(user){
    let result = await setUserInDBAndRetrieveInfo(user);
    let pFp;
    if(user.photoURL == undefined || user.photoURL == null || user.photoURL==""){
      pFp = 'Images/NoProfilePhoto.png';
    }else{
      pFp = user.photoURL;
    }

    currentUserUID = user.uid;

    let result1 = await setNewReleases();
    let result2 = await setRandomSongs();
    let result3 = await setRecommendedArtist();

    if(userAccType == "Admin"){
      document.getElementById('adminUploader').classList.remove('displayNone');
    }else{
      document.getElementById('adminUploader').classList.add('displayNone');
    }

    setAccountDetails(pFp,result,user.email);
    document.querySelector(".loginScreen").classList.add("displayNone");
    // console.log("Sta se desi kad se user sign inuje i kada se vrati u aplikaciju dok je sign inovan");
  }else{
    document.querySelector(".loginScreen").classList.remove("displayNone");
    document.getElementById("loaderHolder").classList.add("displayNone");
    // console.log("Sta se desi kad se user sogn autuje");
  }
})

function setUserInDBAndRetrieveInfo(user){
  return new Promise((resolve) => {
    let username;
    if(user.displayName == undefined || user.displayName == null){
      username = document.getElementById('displayNameInput').value;
    }else{
      username = user.displayName;
    }
    get(child(dbRef,"Users/"+user.uid)).then((snapshot)=>{
      let br = -1;
      if(!snapshot.exists()){
        set(ref(db,"Users/"+user.uid),
        {
            DisplayName: username,
            Email: user.email,
            Type: "User",
            LikedSongs: "",
            FollowedArtists: ""
        }).then(()=>{
            resolve(username);
        }).catch((error)=>{
          resolve(username);
            alert("Something went wrong >:("+error);
        })
      }else{
        userAccType = snapshot.val().Type;
        username = snapshot.val().DisplayName;
        let likedSongs = snapshot.val().LikedSongs;
        likedSongs = likedSongs.split(',');
        likedSongs.reverse();
        document.querySelector('.likedSongsHolder').innerHTML = "";
        likedSongs.forEach(async(likedSong) => {
          let result = await fillLikedSongs(likedSong, br++);
          setNumberOfLikedSongs();
        })
        resolve(username);
      }
    })
  })
}

async function fillLikedSongs(songId, br){
  return new Promise(resolve => {
    get(child(dbRef, "Songs/" + songId)).then(async(snapshot) => {
      if(snapshot.exists()){
        let result = await getArtistNameFromId(snapshot.val().Artist);
        let newLi = `<li data-songnumber="${br}" class="songItemHorizontal">
        <div class="songClickDivHorizontal" data-songname="${snapshot.val().Name}" data-artistname="${result}" data-artistid="${snapshot.val().Artist}" data-songid="${songId}" data-songurl="${snapshot.val().SongURL}" data-songpicture="${snapshot.val().Picture}" onclick="playSong(this)"></div>
        <div class="detailsHolder">
          <img src="${snapshot.val().Picture}" alt="" class="smallImage">
          <div>
          <h3>${snapshot.val().Name}</h3>
          <p>${result}</p>
          </div>
        </div>
        <i onclick="addSongToLiked(this.parentElement.children[0],false,true)" class="fa-solid fa-heart likeIcon songLikedBtn"></i>
        <img src="Images/EqualizerIcon.gif" class="visualizerHorizontal displayNone">
      </li>`;
      document.querySelector('.likedSongsHolder').innerHTML += newLi;
      resolve(true);
      }
    })
  })
}

signInGoogleBtn.addEventListener('click', googleUserSignIn);
googleSignOutBtn.addEventListener('click', googleUserSignOut);

// SETTING DEFAULT STUFF

function songLiked(songId){
  return new Promise(resolve=>{
    get(child(dbRef, "Users/" + currentUserUID)).then((snapshot) => {
      if(snapshot.exists()){
        let likedSongs = snapshot.val().LikedSongs;

        likedSongs=likedSongs.split(',');

        if(likedSongs.includes(songId.toString())){
          resolve(true);
        }else{
          resolve(false);
        }
      }
      })
  })
}

let recommendedArtistsSongs;
let recommendedArtistName;
async function setRecommendedArtist(){
  let result=await getTheNumberOfArtists();
  let randomID= Math.floor(Math.random()*numberOfArtists);
  if(randomID == 0){
    randomID = 1;
  }

  let artistSongs = await getSongsByArtistId(randomID);
  recommendedArtistsSongs=artistSongs;
  let n = artistSongs.length;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n-1-i; j++) {
      if(artistSongs[j].views>artistSongs[j+1])
      {
          let temp = artistSongs[j];
          artistSongs[j]=artistSongs[j+1];
          artistSongs[j+1]=temp;
      }
    }
  }
  get(child(dbRef,"Artists/"+randomID)).then(async (snapshot)=>{
    if(snapshot.exists()){
      let banner = snapshot.val().Banner;
      let name = snapshot.val().Name;
      let desc = snapshot.val().Description;
      let followers = snapshot.val().Followers;
      let profPic = snapshot.val().ProfilePicture;

      document.getElementById("recommendedArtistBanner").src=banner;
      document.getElementById("recommendedArtistName").innerHTML=name;
      document.getElementById("recommendedArtistName").setAttribute('data-artistid', randomID);
      document.getElementById("recommendedArtistDesc").innerHTML=desc;
      document.getElementById("recommendedArtistFollowers").innerHTML=followers + ' Followers';
      document.getElementById("recommendedPP").src=profPic;

      recommendedArtistName=name;
      fillRecommendedArtistSongs(artistSongs,name);
      removeLoader();
    }
  })
}

async function fillRecommendedArtistSongs(artistSongs,name){
  let recommendedArtistTopSongs=document.getElementById("recommendedArtistTopSongs");
  let checkLike;
  recommendedArtistTopSongs.innerHTML="";
  for (let i = 0; i < 3; i++) {
    if(artistSongs[i] != undefined){
      let checkForLikes=await songLiked(artistSongs[i].songid);
      if(checkForLikes)
      {
        checkLike="songLikedBtn fa-solid ";
      }
      else{
        checkLike="fa-regular";
      }
      recommendedArtistTopSongs.innerHTML+=
    `<li class="songItemHorizontal" data-songnumber="${i}">
      <div class="songClickDivHorizontal" data-songname="${artistSongs[i].name}" data-artistname="${name}" data-artistid="${artistSongs[i].artist}" data-songid="${artistSongs[i].songid}" data-songurl="${artistSongs[i].songURL}" data-songpicture="${artistSongs[i].picture}" onclick="playSong(this)"></div>
      <div class="detailsHolder">
        <img src="${artistSongs[i].picture}" alt="" class="smallImage">
        <div>
        <h3>${artistSongs[i].name}</h3>
        <p>${name}</p>
        <p class="songViews">Views <span>${artistSongs[i].views}</span></p>
        </div>
      </div>
      <i onclick="addSongToLiked(this.parentElement.children[0])" class="${checkLike} fa-heart likeIcon"></i>
      <img src="Images/EqualizerIcon.gif" class="visualizerHorizontal displayNone">
    </li>`;
    }
  }
}

function getTheNumberOfArtists()
{
    return new Promise(resolve => {
        setTimeout(() => {
            const countRef = ref(db,'Artists/');
            onValue(countRef,(snapshot)=>{
                const data=snapshot.val();
                numberOfArtists=data.length;
                resolve(true);      
            })
        }, 500);
    })   
}

function getNumberOfSongs(){
  return new Promise(resolve => {
      setTimeout(() => {
          const countRef = ref(db,'Songs/');
          onValue(countRef,(snapshot)=>{
              const data=snapshot.val();
              numberOfSongs=data.length;
              resolve(true);                          
          })
      }, 500);
  })
}

async function setNewReleases(){
  let result = await getNumberOfSongs();

  const newReleasesHolder = document.querySelector('.newReleasesHolder');
  newReleasesHolder.innerHTML = "";
  let br = 0;
  for (let i = numberOfSongs-1; i  > (numberOfSongs-12); i--) {
    get(child(dbRef,"Songs/"+i)).then(async (snapshot)=>{
      if(snapshot.exists()){
        let artistName = await getArtistNameFromId(snapshot.val().Artist);
        let newLi = `
        <li data-songnumber="${br++}" data-songid="${i}" data-songURL="${snapshot.val().SongURL}" class="songItemVertical">
        <div class="songClickDivVertical" data-songname="${snapshot.val().Name}" data-artistname="${artistName}" data-artistid="${snapshot.val().Artist}" data-songid="${i}" data-songurl="${snapshot.val().SongURL}" data-songpicture="${snapshot.val().Picture}" onclick="playSong(this)"></div>
          <img src="${snapshot.val().Picture}" alt="Song Item Banner">
          <div class="songInfo">
              <h3 >${snapshot.val().Name}</h3>
              <h5 data-artistid="${snapshot.val().Artist}" onclick="openArtistPage(this)">${artistName}</h5>
          </div>
          <img src="Images/EqualizerIcon.gif" class="visualizerVertical displayNone">
        </li>
        `;
        newReleasesHolder.innerHTML += newLi;
      }
    })
  }
}

async function setRandomSongs(){
  let result = await getNumberOfSongs();
  const randomSongsHolder = document.querySelector('.randomSongsHolder');
  randomSongsHolder.innerHTML = "";
  let array =[];

  for (let i = 0; i  < 10; i++) {
    while(true){
      let randomNumber=Math.floor(Math.random()*numberOfSongs);
      if(!array.includes(randomNumber)){
        array.push(randomNumber);
        generateOneSong(randomNumber,randomSongsHolder, i);
        break;
      }
    }
  }
}

function generateOneSong(randomNumber,randomSongsHolder, i){
  
  get(child(dbRef,"Songs/"+randomNumber)).then(async (snapshot)=>{
    if(snapshot.exists()){
      let artistName = await getArtistNameFromId(snapshot.val().Artist);
      let newLi = `
      <li data-songnumber="${i}" data-songid="${randomNumber}" data-songURL="${snapshot.val().SongURL}" class="songItemVertical">
      <div class="songClickDivVertical" data-songname="${snapshot.val().Name}" data-artistname="${artistName}" data-artistid="${snapshot.val().Artist}" data-songid="${randomNumber}" data-songurl="${snapshot.val().SongURL}" data-songpicture="${snapshot.val().Picture}" onclick="playSong(this)"></div>
        <img src="${snapshot.val().Picture}" alt="Song Item Banner">
        <div class="songInfo">
            <h3>${snapshot.val().Name}</h3>
            <h5 data-artistid="${snapshot.val().Artist}" onclick="openArtistPage(this)">${artistName}</h5>
        </div>
        <img src="Images/EqualizerIcon.gif" class="visualizerVertical displayNone">
      </li>
      `;
     randomSongsHolder.innerHTML += newLi;
  }
 })
}



function getArtistNameFromId(id){
  return new Promise(resolve => {
    setTimeout(() => {
      get(child(dbRef,"Artists/"+id)).then((snapshot)=>{
        if(snapshot.exists()){
          resolve(snapshot.val().Name);
        }
      })
    }, 500);
  })
}


function setAccountDetails(pfp,dName,email){
  let pfps=document.getElementsByName('pfp');
  let dNames=document.getElementsByName('displayName');

  pfps.forEach((pic)=>{
    pic.src=pfp;
  })

  dNames.forEach((name)=>{
    name.innerHTML=dName;
  })

}

//PLAYING THE SONG

let isSongPlaying = false;

let playerInfo = document.querySelector('.playerInfo');

const playBtn = document.getElementById('playBtn');
const volumeInput = document.getElementById('volumeInput');
const seekInput = document.getElementById('seekInput');
const playLikeBtn=document.getElementById('playerLikeBtn');
let isMouseDownOnInput = false;  

let bool = false;

let currentPlayListParent;
let currentPlayListParentSongNumber = null;

function resetVisualizers(){
  let allPlayLists = document.getElementsByName("songHolders");
  for (let j = 0; j < allPlayLists.length; j++) {
    let playlist=allPlayLists[j];
    for (let i = 0; i < playlist.children.length; i++) {
      let li=playlist.children[i];
      li.children[li.children.length-1].classList.add("displayNone");
    }
  }
  
}

//PLAYSONG
export async function playSong(clickedSong){
  let songIdToPlay = clickedSong.getAttribute('data-songid');
  let checkForLikes=await songLiked(songIdToPlay);
  let checkLike,checkLike2="";
  if(checkForLikes)
  {
    checkLike="songLikedBtn";
    checkLike2="fa-solid";
  }
  else{
    checkLike="fa-regular";
  }
  let songURLToPlay = clickedSong.getAttribute('data-songurl');
  let songBannerToPlay = clickedSong.getAttribute('data-songpicture');
  let songArtistIdToPlay = clickedSong.getAttribute('data-artistid');
  let songArtistToPlay = clickedSong.getAttribute('data-artistname');
  let songTitleToPlay = clickedSong.getAttribute('data-songname');

  audioOutput.src = songURLToPlay;
  audioOutput.currentTime = 0;
  audioOutput.play();
  addViewToSong(songIdToPlay);
  // SETTING THE SEEK TO 0%
  document.getElementById('seekBody').style.width = `0%`;
  document.getElementById('seekPin').style.left = `0%`;
  document.getElementById('startTime').innerHTML = `0:00`;
  document.getElementById('endTime').innerHTML = `0:00`;

  // --- SETTING THE SONG INFO ON THE PLAYER
  playerInfo.children[0].src = songBannerToPlay;
  playerInfo.children[1].children[0].innerHTML = songTitleToPlay;
  playerInfo.children[1].children[1].innerHTML = songArtistToPlay;
  playerInfo.children[1].children[1].setAttribute('data-artistid', songArtistIdToPlay);

  playLikeBtn.classList.remove('fa-regular');
  playLikeBtn.classList.remove('fa-solid');
  playLikeBtn.classList.remove('songLikedBtn');
  playLikeBtn.classList.add(checkLike);
  if(checkLike2!=""){
    playLikeBtn.classList.add(checkLike2);
  }
  playLikeBtn.setAttribute('data-songid', songIdToPlay);
  // --- SETTING THE PLAYER BUTTONS TO PLAYING STATE
  playBtn.innerHTML = `<i class="fa-solid fa-circle-pause"></i>`;

  isSongPlaying = true;
  currentPlayListParent = clickedSong.parentElement.parentElement;
  currentPlayListParentSongNumber=clickedSong.parentElement.getAttribute("data-songnumber");

  resetVisualizers();
  clickedSong.parentElement.children[clickedSong.parentElement.children.length-1].classList.remove("displayNone");
}

//FORWARDING
document.getElementById("backwardsBtn").addEventListener('click', () =>{
  if(audioCurr > 1){
    currentPlayListParent.children[currentPlayListParentSongNumber].children[0].click();
  }else{
    if(currentPlayListParentSongNumber > 0){
      currentPlayListParent.children[--currentPlayListParentSongNumber].children[0].click();
    }
  }
})
document.getElementById("forwardsBtn").addEventListener('click', () =>{
  if(currentPlayListParentSongNumber < currentPlayListParent.children.length - 1){
    currentPlayListParent.children[++currentPlayListParentSongNumber].children[0].click();
  }
})

//VIEWS
function addViewToSong(songId){
  if(bool){
    get(child(dbRef,"Songs/" + songId)).then((snapshot)=>{
      if(snapshot.exists()){
        set(ref(db,"Songs/" + songId),
          {
              Artist: snapshot.val().Artist,
              Genres: snapshot.val().Genres,
              Name: snapshot.val().Name,
              Picture: snapshot.val().Picture,
              SongURL: snapshot.val().SongURL,
              Likes: snapshot.val().Likes,
              Views: (snapshot.val().Views+1)
          }).then(()=>{
            
          }).catch((error)=>{
            console.log(error.message);
          })
      }
    })
    bool = false;
  }
}

// PLAY BUTTON CLICKED
playBtn.addEventListener('click', () => {
  if(audioOutput.src != ""){
    if(isSongPlaying){
      audioOutput.pause();
      isSongPlaying = false;
    }else{
      audioOutput.play();
      isSongPlaying = true;
    }
  }
})

// WHEN AUDIO IS PAUSED
audioOutput.addEventListener('pause', () => {
  playBtn.innerHTML = `<i class="fa-solid fa-circle-play"></i>`;
})

// WHEN AUDIO IS PLAYED
audioOutput.addEventListener('play', () => {
  playBtn.innerHTML = `<i class="fa-solid fa-circle-pause"></i>`;
})

let audioCurr;

// AUDIO ON TIMEUPDATE
audioOutput.addEventListener('timeupdate', () => {
  audioCurr = audioOutput.currentTime;
  let audioDur = audioOutput.duration;

  let min = Math.floor(audioDur / 60);
  let sec = Math.floor(audioDur % 60);
  if(audioCurr > 5){
    bool = true;
  }

  if(sec<10){
    sec = `0${sec}`;
  }

  document.getElementById('endTime').innerHTML = `${min || '0'}:${sec || '00'}`;

  let min2 = Math.floor(audioCurr / 60);
  let sec2 = Math.floor(audioCurr % 60);

  if(sec2<10){
    sec2 = `0${sec2}`;
  }

  document.getElementById('startTime').innerHTML = `${min2}:${sec2}`;

  if(!isMouseDownOnInput){
    let progressBar = (audioOutput.currentTime/audioOutput.duration)*100;
    if(progressBar >= 98.4){
      progressBar = 98.4;
    }
    if(progressBar <= 0){
      progressBar = 0;
    }
    document.getElementById('seekBody').style.width = `${progressBar}%`;
    document.getElementById('seekPin').style.left = `${progressBar}%`;
  }

  if(audioCurr == audioDur && !repeatOn){
    document.getElementById("forwardsBtn").click();
  }
})

// AUDIO ENDED - REPEAT - FORWARD - BACKWARD

const repeatBtn = document.getElementById('repeatBtn');
let repeatOn = false;

repeatBtn.addEventListener('click', () => {
  repeatOn = !repeatOn;
  repeatBtn.classList.toggle('repeatBtnOn');
})

audioOutput.addEventListener('ended', () => {
  if(repeatOn){
    audioOutput.currentTime = 0;
    audioOutput.play();
  }else{

  }
})

// VOLUME INPUT CHANGE
volumeInput.addEventListener('input', () => {
  audioOutput.volume = (volumeInput.value / 100);
  if(audioOutput.volume == 0){
    document.querySelector('.volumeIcon').innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
  }
  if(audioOutput.volume > 0){
    document.querySelector('.volumeIcon').innerHTML = `<i class="fa-solid fa-volume-low"></i>`;
  }
  if(audioOutput.volume >= 0.75){
    document.querySelector('.volumeIcon').innerHTML = `<i class="fa-solid fa-volume-high"></i>`;
  }
})

let volumeBeforeMuting;
let lastVolumeIcon;
export function toggleMuteVolume(label){
    if(audioOutput.volume != 0){
      volumeBeforeMuting = audioOutput.volume;
      lastVolumeIcon = label.innerHTML;
      audioOutput.volume = 0;
      volumeInput.value = 0;
      label.innerHTML = `<i class="fa-solid fa-volume-xmark"></i>`;
    }else{
      label.innerHTML = lastVolumeIcon;
      audioOutput.volume = volumeBeforeMuting;
      volumeInput.value = volumeBeforeMuting*100;
    }
}

// SEEK INPUT CHANGE
seekInput.addEventListener('change', () => {
  if(audioOutput.src != ""){
    var seekto = audioOutput.duration * (seekInput.value / 100);
    audioOutput.currentTime = seekto;
  }
})

seekInput.addEventListener('mousedown', (e) => {
  if(e.target.id == "seekInput"){
    isMouseDownOnInput = true;
  }
})

seekInput.addEventListener('mouseup', (e) => {
  isMouseDownOnInput = false;
})

seekInput.addEventListener('mousemove', (e) => {
  if(e.target.id == "seekInput" && isMouseDownOnInput){
    // e = Mouse click event.
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left; //x position within the element.
    
    let progressBar = (x / e.target.clientWidth)*100;
    if(progressBar >= 98.4){
      progressBar = 98.4;
    }
    if(progressBar <= 0){
      progressBar = 0;
    }
    document.getElementById('seekBody').style.width = `${progressBar}%`;
    document.getElementById('seekPin').style.left = `${progressBar}%`;
  }
})

//GET ARTIST BY ID
function getArtistById(artistId){
  return new Promise(resolve => {
    setTimeout(() => {
      get(child(dbRef, "Artists/" + artistId)).then((snapshot) => {
        if(snapshot.exists()){
          let artistObject = {
            name: snapshot.val().Name,
            banner: snapshot.val().Banner,
            profilePicture: snapshot.val().ProfilePicture,
            description: snapshot.val().Description,
            followers: snapshot.val().Followers
          }
          resolve(artistObject);
        }
      })
    }, 300);
  })
}

export async function openArtistPage(artist){
  var artistId = artist.getAttribute('data-artistid');
  if(artistId.toString() != '0'){
    document.getElementById("loaderHolder").classList.remove("displayNone");
    document.querySelector("."+currentPage+"Page").classList.add("displayNone");
    document.querySelector(".artistPage").classList.remove("displayNone");
    let artistObject = await getArtistById(artistId);
    document.getElementById("bannerImg").src = artistObject.banner;
    document.getElementById("artistName").innerHTML = artistObject.name;
    document.getElementById("artistDescription").innerHTML = artistObject.description;
    document.querySelector(".artistProfilePicture").src = artistObject.profilePicture;
    document.getElementById("artistsSongHolderName").innerHTML = artistObject.name;
    document.querySelector(".Follow").setAttribute("data-artistid", artistId);
    setArtistSongs(artistId, artistObject.name);
    removeLoader();
  }
}

//GET SONGS BY ARTIST ID
function getSongsByArtistId(artistId){
  return new Promise(resolve => {
    setTimeout(() => {
      const countRef = ref(db,'Songs/');
            onValue(countRef,(snapshot) => {
                const data = snapshot.val(); 
                let songObjectList = [];
                let br = 0;
                data.forEach((song) => {
                  ++br;
                  if(song.Artist == artistId){
                    let songObject = {
                      songid: br,
                      artist: song.Artist,
                      genres: song.Genres,
                      likes: song.Likes,
                      name: song.Name,
                      picture: song.Picture,
                      songURL: song.SongURL,
                      views: song.Views
                    }
                    songObjectList.push(songObject);
                  }
                })
                resolve(songObjectList);
              })
    }, 300);
  })
}

async function setArtistSongs(artistId, artistName){
  let checkLike;
  let songObjectList1 = await getSongsByArtistId(artistId);
  let songsHolder = document.getElementById("songsHolder");
  songsHolder.innerHTML = "";
  let br = 0;
  songObjectList1.forEach(async(song) => {
      let checkForLikes=await songLiked(song.songid);
      if(checkForLikes)
      {
        checkLike="songLikedBtn fa-solid ";
      }
      else{
        checkLike="fa-regular";
      }
    songsHolder.innerHTML +=
    `<li class="songItemHorizontal" data-songnumber="${br++}">
      <div class="songClickDivHorizontal" data-songname="${song.name}" data-artistname="${artistName}" data-artistid="${song.artist}" data-songid="${song.songid}" data-songurl="${song.songURL}" data-songpicture="${song.picture}" onclick="playSong(this)"></div>
      <div class="detailsHolder">
        <img src="${song.picture}" alt="" class="smallImage">
        <div>
        <h3>${song.name}</h3>
        <p>${artistName}</p>
        </div>
      </div>
      <i class="${checkLike} fa-heart likeIcon" onclick="addSongToLiked(this.parentElement.children[0])"></i>
      <img src="Images/EqualizerIcon.gif" class="visualizerHorizontal displayNone">
    </li>`;
  });
}

// ----- ADDING SONG TO LIKED ----- Ne sacuvaj Boze 
//ne pitaje nas pls

export function addSongToLiked(clickedSong, isFromPlayer, isFromLiked){
  let songIdToLike = clickedSong.getAttribute('data-songid');
  if(songIdToLike != null || songIdToLike != undefined){
    get(child(dbRef, "Users/" + currentUserUID)).then((snapshot) => {
      if(snapshot.exists()){
        let likedSongs = snapshot.val().LikedSongs;
        let likedSongsArray = likedSongs.split(',');
        if(likedSongsArray.includes(songIdToLike)){
          likedSongsArray = likedSongsArray.filter((song) => song != songIdToLike);
          likedSongs = likedSongsArray.toString();
          set(ref(db,"Users/"+currentUserUID),
          {
            DisplayName: snapshot.val().DisplayName,
            Email: snapshot.val().Email,
            Type: snapshot.val().Type,
            LikedSongs: likedSongs,
            FollowedArtists: snapshot.val().FollowedArtists
          }).then(()=>{
            if(isFromPlayer){
              clickedSong.classList.remove('songLikedBtn');
              clickedSong.classList.remove('fa-solid');
              clickedSong.classList.add('fa-regular');
              setArtistSongs(document.getElementById("artistIDPlayer").getAttribute('data-artistid'),document.getElementById("artistIDPlayer").innerHTML);
              fillRecommendedArtistSongs(recommendedArtistsSongs,recommendedArtistName);
              refreshLiked();
            }else{
              if(clickedSong.getAttribute('data-songid')==playLikeBtn.getAttribute('data-songid')){
                playLikeBtn.classList.remove('songLikedBtn');
                playLikeBtn.classList.remove('fa-solid');
                playLikeBtn.classList.add('fa-regular');
              }
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.remove('songLikedBtn');
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.remove('fa-solid');
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.add('fa-regular');
              refreshLiked();
            }
          }).catch((error)=>{
            console.log(error.message);
          })
        }else{
          likedSongs += `${songIdToLike},`;
          set(ref(db,"Users/"+currentUserUID),
          {
            DisplayName: snapshot.val().DisplayName,
            Email: snapshot.val().Email,
            Type: snapshot.val().Type,
            LikedSongs: likedSongs,
            FollowedArtists: snapshot.val().FollowedArtists
          }).then(()=>{
            if(isFromPlayer){
              clickedSong.classList.add('songLikedBtn');
              clickedSong.classList.remove('fa-regular');
              clickedSong.classList.add('fa-solid');
              setArtistSongs(document.getElementById("artistIDPlayer").getAttribute('data-artistid'),document.getElementById("artistIDPlayer").innerHTML);
              fillRecommendedArtistSongs(recommendedArtistsSongs,recommendedArtistName);
              refreshLiked();
            }else{
              if(clickedSong.getAttribute('data-songid')==playLikeBtn.getAttribute('data-songid')){
                playLikeBtn.classList.add('songLikedBtn');
                playLikeBtn.classList.remove('fa-regular');
                playLikeBtn.classList.add('fa-solid');
              }
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.add('songLikedBtn');
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.remove('fa-regular');
              clickedSong.parentElement.children[clickedSong.parentElement.children.length-2].classList.add('fa-solid');
              refreshLiked();
            }
          }).catch((error)=>{
            console.log(error.message);
          })
        }
      }
    })
  }
}

let searchInput = document.getElementById("searchInput");
searchInput.addEventListener('keyup', event => {
  if(event.key == "Enter"){
    searchSongByName(searchInput.value);
  }
})

function writeEmpty(resultHolder){
  resultsHolder.classList.remove("displayNone");
      resultsHolder.innerHTML = 
      `<li class="songItemHorizontal" style="cursor: default;">
        <p style="width:100%; display:flex; justify-content:center;">There is no song with this name</p>
      </li>`;
}

export async function searchSongByName(songName){
  let resultsHolder = document.getElementById("resultsHolder");
  if(searchText != songName && songName != ""){
    searchText = songName;
  let songsThatAreInSearch = [];
  resultsHolder.innerHTML = "";
  onValue(ref(db, 'Songs/'), (snapshot) => {
    snapshot.forEach((childSnapshot) => {
      if(childSnapshot.val().Name.toLowerCase().includes(songName.toLowerCase())){
        songsThatAreInSearch.push(childSnapshot.key);
      }
    });
    if(songsThatAreInSearch.length == 0){
      writeEmpty(resultsHolder);
    }
    for (let i = 0; i < songsThatAreInSearch.length; i++) {
      get(child(dbRef, "Songs/" + songsThatAreInSearch[i])).then(async(snapshot) => {
        if(snapshot.exists()){
          if(i == 0){
            resultsHolder.classList.remove('displayNone');
          }
          let checkForLikes=await songLiked(songsThatAreInSearch[i]);
          let checkLike;
          if(checkForLikes)
          {
            checkLike="songLikedBtn fa-solid ";
          }
          else{
            checkLike="fa-regular";
          }
          let artistName = await getArtistNameFromId(snapshot.val().Artist);
          resultsHolder.innerHTML += 
          `<li class="songItemHorizontal">
          <div id="searchLoaderHolder">
                    <div id="loader">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            <div class="songClickDivHorizontal" data-songname="${snapshot.val().Name}" data-artistname="${artistName}" data-artistid="${snapshot.val().Artist}" data-songid="${songsThatAreInSearch[i]}" data-songurl="${snapshot.val().SongURL}" data-songpicture="${snapshot.val().Picture}" onclick="playSong(this)"></div>
            <div class="detailsHolder">
              <img onload="removeLoader2(this.parentElement.parentElement.children[0])" src="${snapshot.val().Picture}" alt="" class="smallImage">
              <div>
              <h3>${snapshot.val().Name}</h3>
              <p>${artistName}</p>
              </div>
            </div>
          </li>`;
          }
        })
      }
    })
  }else if(songName == ""){
    writeEmpty(resultsHolder);
  }
}

function getLikedSongs(){
  return new Promise(resolve => {
    get(child(dbRef, "Users/" + currentUserUID)).then((snapshot) => {
      if(snapshot.exists()){
        let likedSongs = snapshot.val().LikedSongs;
        likedSongs = likedSongs.split(',');
        likedSongs.pop();
        resolve(likedSongs.reverse());
      }
    })
  })
}

async function refreshLiked(){
  let varr = await getLikedSongs();
  document.querySelector('.likedSongsHolder').innerHTML = "";
  let br = -1;
  if(varr == ""){
    setNumberOfLikedSongs();
  }else{
    varr.forEach(async(likeSong) => {
      await fillLikedSongs(likeSong, br);
      br++;
      setNumberOfLikedSongs();
    })
  }
}

export function followArtist(artistId){
  get(child(dbRef,"Users/" + currentUserUID)).then((snapshot)=>{
    if(snapshot.exists()){
      let newFollowedArtists = snapshot.val().FollowedArtists;
      newFollowedArtists = newFollowedArtists.split(',');
      if(!newFollowedArtists.includes(artistId)){
        newFollowedArtists.toString();
        newFollowedArtists += `${artistId},`;
        set(ref(db,"Users/"+currentUserUID),
        {
        DisplayName: snapshot.val().DisplayName,
        Email: snapshot.val().Email,
        Type: snapshot.val().Type,
        LikedSongs: snapshot.val().LikedSongs,
        FollowedArtists: newFollowedArtists
        }).then(()=>{
          document.querySelector(".Follow").children[1].innerHTML = "Unfollow";
          get(child(dbRef,"Artists/" + artistId)).then((snapshot)=>{
            if(snapshot.exists()){
              let updates;
              updates = {
                Name: snapshot.val().Name,
                Banner: snapshot.val().Banner,
                ProfilePicture: snapshot.val().ProfilePicture,
                Description: snapshot.val().Description,
                Followers: snapshot.val().Followers + 1
              }
              update(ref(db, "Artists/" + artistId), updates);
              document.getElementById("artistFollowers").innerHTML = snapshot.val().Followers + 1 + " Followes";
              document.querySelector(".Follow").children[0].className = "fa-solid fa-user-minus";
            }
          })
        })
      }else{
        newFollowedArtists = newFollowedArtists.filter((artist) => artist != artistId);
        set(ref(db,"Users/"+currentUserUID),
        {
        DisplayName: snapshot.val().DisplayName,
        Email: snapshot.val().Email,
        Type: snapshot.val().Type,
        LikedSongs: snapshot.val().LikedSongs,
        FollowedArtists: newFollowedArtists.toString()
        }).then(()=>{
          document.querySelector(".Follow").children[1].innerHTML = "Follow";
          get(child(dbRef,"Artists/" + artistId)).then((snapshot)=>{
            if(snapshot.exists()){
              let updates;
              updates = {
                Name: snapshot.val().Name,
                Banner: snapshot.val().Banner,
                ProfilePicture: snapshot.val().ProfilePicture,
                Description: snapshot.val().Description,
                Followers: snapshot.val().Followers -1
              }
              update(ref(db, "Artists/" + artistId), updates);
              document.getElementById("artistFollowers").innerHTML = snapshot.val().Followers - 1 + " Followes";
              document.querySelector(".Follow").children[0].className = "fa-solid fa-user-plus";
            }
          })
        }).catch((error)=>{
          console.log(error.message);
        })
      }
    }
  })
}

let checkForArtist = document.getElementById("artistIDPlayer");
checkForArtist.addEventListener('click' , () => {
  let artistId = checkForArtist.getAttribute('data-artistid');
  if(artistId == 0){
    return;
  }
  document.getElementById("loaderHolder").classList.remove("displayNone");
  get(child(dbRef,"Artists/" + checkForArtist.getAttribute('data-artistid'))).then((snapshot)=>{
    document.getElementById("artistFollowers").innerHTML = snapshot.val().Followers + " Followers" ;
  })
  get(child(dbRef, "Users/" + currentUserUID)).then((snapshot) => {
    if(snapshot.val().FollowedArtists.split(',').includes(checkForArtist.getAttribute('data-artistid'))){
      document.querySelector(".Follow").children[1].innerHTML = "Unfollow";
      document.querySelector(".Follow").children[0].className = "fa-solid fa-user-minus";
    }else{
      document.querySelector(".Follow").children[1].innerHTML = "Follow";
      document.querySelector(".Follow").children[0].className = "fa-solid fa-user-plus";
    }
  })
})