import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-analytics.js";
import { } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';
import { getStorage, ref as sRef, uploadBytesResumable, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-storage.js';
import { getDatabase,ref, set, child, get, update, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-database.js';
import { getAuth, signInWithRedirect, getRedirectResult , GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js';

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

const app=initializeApp(firebaseConfig);
const analytics=getAnalytics(app);
const auth=getAuth(app);
const db=getDatabase();
const storage=getStorage();

var numberOfArtists;
var numberOfSongs;

getArtists();

function getArtists()
{
    return new Promise(resolve => {
        setTimeout(() => {
            const countRef = ref(db,'Artists/');
            onValue(countRef,(snapshot)=>{
                const data=snapshot.val();

                numberOfArtists=data.length;
                document.getElementById('artistInput').innerHTML = "";
                for (let i = 1; i < data.length; i++) {
                    var artistInput = document.getElementById('artistInput');
                    artistInput.innerHTML +=`<option value="${i}">${data[i].Name}</option>`;
                }
            })
        }, 500);
    })   
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


let reader = new FileReader();
let reader2 = new FileReader();
let files=[],files2=[];
let imageFileName,songFileName;
let imageDownloadLink,songDownloadLink;
let songCoverInput=document.getElementById('songBannerInput');
let songAudioInput=document.getElementById('songAudioInput');
let songTitleInput=document.getElementById('songTitleInput');
let songArtistInput=document.getElementById('artistInput');
let songGenreInput= document.getElementById('songCatInput');

document.getElementById('songAudioInputPreview').volume=0.05;



songCoverInput.onchange=e=>{
    files=e.target.files;
    imageFileName=files[0].name;
    let split = imageFileName.split('.');

    if(split[split.length-1]=='png' || split[split.length-1]=='jpg' || split[split.length-1]=='jpeg'|| split[split.length-1]=='heif'){
        reader.readAsDataURL(files[0]);
        reader.addEventListener('load',function(){
        document.getElementById('songBannerInputPreview').src=this.result;
    });
    }
    else{
        alert('Unsupported image format');
    }   
}

songAudioInput.onchange=e=>{
    files2=e.target.files;
    songFileName=files2[0].name;
    let split = songFileName.split('.');

    if(split[split.length-1]=='wav' || split[split.length-1]=='mp3'){
        reader2.readAsDataURL(files2[0]);
        reader2.addEventListener('load',function(){
        document.getElementById('songAudioInputPreview').src=this.result;
    });
    }
    else{
        alert('Unsupported audio file format');
    }   
}


let songForm = document.getElementById('songForm');

function formValidationSong(){
    if(songCoverInput.files.length>0 && songAudioInput.files.length>0 && songTitleInput.value!='' && songArtistInput.value!='' && songGenreInput.value!=''){
        return true;
    }else{
        return false;
    }
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


songForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(formValidationSong()){
        document.getElementById('upBtn').disabled=true;
        let result = await uploadProcessImage();
        let result2 = await uploadProcessSong();
        let result3 = await getNumberOfSongs();
        set(ref(db,"Songs/"+numberOfSongs),
        {
            Artist: artistInput.value,
            Genres: songGenreInput.value,
            Name: songTitleInput.value,
            Picture: imageDownloadLink,
            SongURL: songDownloadLink,
            Likes: 0,
            Views: 0
        }).then(()=>{
            document.getElementById('upBtn').disabled=false;
            alert("Song added! >:)");
            document.getElementById('resetSongFormBtn').click();
        }).catch((error)=>{
            document.getElementById('upBtn').disabled=false;
            alert("Something went wrong >:("+error);
        })
    }else{
        alert('You forgot something');
    }
})

function uploadProcessImage(){
    return new Promise(resolve =>{
        setTimeout(() => {
           let imageToUpload=files[0];
           const metaData={
                contentType:imageToUpload.type
           };
           const storageRef=sRef(storage,"Songs/"+imageFileName);
           const uploadTask=uploadBytesResumable(storageRef,imageToUpload,metaData);
           uploadTask.on('state-changed',(snapshot)=>{
                let progress=(snapshot.bytesTransferred/snapshot.totalBytes)*100;
                document.getElementById('progressBarSpan').style.width=progress+'%';
           },
           (error)=>{
                alert("Image failed to upload "+error);
                resolve(false);
           },
           ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                    imageDownloadLink=downloadURL;
                    resolve(true);
                })
           })
        }, 1000);
    })
}

function uploadProcessSong(){
    return new Promise(resolve =>{
        setTimeout(() => {
           let songToUpload=files2[0];
           const metaData={
                contentType:songToUpload.type
           };
           const storageRef=sRef(storage,"Songs/"+songFileName);
           const uploadTask=uploadBytesResumable(storageRef,songToUpload,metaData);
           uploadTask.on('state-changed',(snapshot)=>{
                let progress=(snapshot.bytesTransferred/snapshot.totalBytes)*100;
                document.getElementById('progressBarSpan2').style.width=progress+'%';
           },
           (error)=>{
                alert("Audio failed to upload "+error);
                resolve(false);
           },
           ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                    songDownloadLink=downloadURL;
                    resolve(true);
                })
           })
        }, 1000);
    })
}

/* ----- UPLOAD ARTIST ----- */

let reader3 = new FileReader();
let reader4 = new FileReader();
let files3=[],files4=[];
let artistImageFileName,artistBannerFileName;
let artistImageDownloadLink,artistBannerDownloadLink;
const artistProfileInput = document.getElementById('artistProfileInput');
const artistBannerInput = document.getElementById('artistBannerInput');
const artistNameInput = document.getElementById('artistNameInput');
const artistDescInput = document.getElementById('artistDescInput');
const artistCatInput = document.getElementById('artistCatInput');

let artistForm = document.getElementById('artistForm');

artistProfileInput.onchange=e=>{
    files3=e.target.files;
    artistImageFileName=files3[0].name;
    let split = artistImageFileName.split('.');

    if(split[split.length-1]=='png' || split[split.length-1]=='jpg' || split[split.length-1]=='jpeg'|| split[split.length-1]=='heif'){
        reader3.readAsDataURL(files3[0]);
        reader3.addEventListener('load',function(){
        document.getElementById('artistProfilePreview').src=this.result;
    });
    }
    else{
        alert('Unsupported image format');
    }   
}

artistBannerInput.onchange=e=>{
    files4=e.target.files;
    artistBannerFileName=files4[0].name;
    let split = artistBannerFileName.split('.');

    if(split[split.length-1]=='png' || split[split.length-1]=='jpg' || split[split.length-1]=='jpeg'|| split[split.length-1]=='heif'){
        reader4.readAsDataURL(files4[0]);
        reader4.addEventListener('load',function(){
        document.getElementById('artistBannerPreview').src=this.result;
    });
    }
    else{
        alert('Unsupported image format');
    }   
}

function formValidationArtist(){
    if(artistBannerInput.files.length > 0 && artistProfileInput.files.length > 0 && artistNameInput.value != '' && artistDescInput.value != '' && artistCatInput.value != ''){
        return true;
    }else{
        return false;
    }
}

artistForm.addEventListener('submit',async(e)=>{
    e.preventDefault();
    if(formValidationArtist()){
        document.getElementById('upBtn2').disabled=true;
        let result = await uploadProcessArtistImage();
        let result2 = await uploadProcessArtistBanner();
        let result3 = await getTheNumberOfArtists();

        set(ref(db,"Artists/"+numberOfArtists),
        {
            Description: artistDescInput.value,
            Followers: 0,
            Genres: artistCatInput.value,
            Name: artistNameInput.value,
            ProfilePicture: artistImageDownloadLink,
            Banner: artistBannerDownloadLink
        })
        .then(()=>{
            document.getElementById('upBtn2').disabled=false;
            alert("Artist added! >:)");
            document.getElementById('resetArtistFormBtn').click();
        })
        .catch((error)=>{
            document.getElementById('upBtn2').disabled=false;
            alert("Something went wrong >:("+error);
        })
    }else{
        alert('You forgot something');
    }
})

function uploadProcessArtistImage(){
    return new Promise(resolve =>{
        setTimeout(() => {
           let imageToUpload=files3[0];
           const metaData={
                contentType:imageToUpload.type
           };
           const storageRef=sRef(storage,"Songs/"+artistImageFileName);
           const uploadTask=uploadBytesResumable(storageRef,imageToUpload,metaData);
           uploadTask.on('state-changed',(snapshot)=>{
                let progress=(snapshot.bytesTransferred/snapshot.totalBytes)*100;
                document.getElementById('progressBarSpan3').style.width=progress+'%';
           },
           (error)=>{
                alert("Image failed to upload "+error);
                resolve(false);
           },
           ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                    artistImageDownloadLink=downloadURL;
                    resolve(true);
                })
           })
        }, 1000);
    })
}

function uploadProcessArtistBanner(){
    return new Promise(resolve =>{
        setTimeout(() => {
           let imageToUpload=files4[0];
           const metaData={
                contentType:imageToUpload.type
           };
           const storageRef=sRef(storage,"Songs/"+artistBannerFileName);
           const uploadTask=uploadBytesResumable(storageRef,imageToUpload,metaData);
           uploadTask.on('state-changed',(snapshot)=>{
                let progress=(snapshot.bytesTransferred/snapshot.totalBytes)*100;
                document.getElementById('progressBarSpan4').style.width=progress+'%';
           },
           (error)=>{
                alert("Image failed to upload "+error);
                resolve(false);
           },
           ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                    artistBannerDownloadLink=downloadURL;
                    resolve(true);
                })
           })
        }, 1000);
    })
}