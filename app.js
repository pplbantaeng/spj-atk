const API_URL = "https://script.google.com/macros/s/AKfycbxVfGC_M4RuyUnS7jMaOlmPz0tSiM0VVcaqfoxttlQvTVb9Iamg93YdXsy64b9rHIB16Q/exec";

let db=[];
let tbody=document.querySelector("#tabel tbody");
let sedangKirim=false;
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

// ===============================
// LOAD DATABASE
// ===============================
fetch("./database_ppl.json")
.then(r=>r.json())
.then(data=>{
db=data.data;

let select=document.getElementById("pplSelect");

db.forEach(p=>{
let opt=document.createElement("option");
opt.value=p.nip;
opt.text=p.nama+" - "+p.nip;
select.appendChild(opt);
});

select.onchange=isiData;
isiData();
});

function isiData(){
let nip=pplSelect.value;
let p=db.find(x=>x.nip==nip);

document.getElementById("nip").value=p.nip;
desa.value=p.desa;
bpp.value=p.bpp;
kecamatan.value=p.kecamatan;
}

// ===============================
// TABEL
// ===============================
function tambahBaris(){
let row=tbody.insertRow();

row.innerHTML=`
<td>${tbody.rows.length}</td>
<td><input></td>
<td><input type="number" value="1"></td>
<td><input></td>
<td><input type="number" oninput="hitung()"></td>
<td class="jumlah">0</td>
`;
}

function hitung(){
let total=0;

[...tbody.rows].forEach(r=>{
let vol=r.cells[2].children[0].value||0;
let harga=r.cells[4].children[0].value||0;
let jumlah=vol*harga;
r.cells[5].innerText=jumlah;
total+=jumlah;
});

document.getElementById("total").innerText=
total.toLocaleString("id-ID");
}

// ===============================
// VALIDASI FILE
// ===============================
function validateFile(file,type){

if(file.size>MAX_SIZE){
alert("Ukuran file maksimal 2MB");
return false;
}

if(type==="image" && !file.type.startsWith("image/")){
alert("File harus gambar (jpg/png)");
return false;
}

if(type==="pdf" && file.type!=="application/pdf"){
alert("File harus PDF");
return false;
}

return true;
}

// ===============================
// CONVERT FILE TO BASE64
// ===============================
function fileToBase64(file){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=()=>resolve(reader.result.split(",")[1]);
reader.onerror=reject;
reader.readAsDataURL(file);
});
}

// ===============================
// KIRIM DATA
// ===============================
async function kirimData(){

if(sedangKirim) return;
sedangKirim=true;

const tombol=document.getElementById("btnSimpan");
tombol.disabled=true;
tombol.innerText="Menyimpan...";

try{

// ===============================
// VALIDASI MINIMAL 1 LAMPIRAN
// ===============================
const inputs=["atk_dok","atk_nota","mm_dok","mm_nota"];
let adaLampiran=false;

for(let id of inputs){
if(document.getElementById(id).files.length>0){
adaLampiran=true;
}
}

if(!adaLampiran){
alert("Minimal harus upload 1 lampiran");
resetTombol(tombol);
return;
}

// ===============================
// VALIDASI & KONVERSI FILE
// ===============================
let filesData={};

for(let id of inputs){

let input=document.getElementById(id);

if(input.files.length>0){

let file=input.files[0];

let type=id.includes("dok")?"image":"pdf";

if(!validateFile(file,type)){
resetTombol(tombol);
return;
}

let base64=await fileToBase64(file);

filesData[id]={
base64:base64,
mimeType:file.type,
ext:file.name.split(".").pop()
};

}
}

// ===============================
// VALIDASI TOTAL
// ===============================
let total=parseInt(
document.getElementById("total")
.innerText.replace(/\./g,'')
);

if(total!==100000){
alert("Total harus Rp100.000");
resetTombol(tombol);
return;
}

// ===============================
// DATA BARANG
// ===============================
let items=[];
[...tbody.rows].forEach(r=>{
items.push({
barang:r.cells[1].children[0].value,
volume:r.cells[2].children[0].value,
satuan:r.cells[3].children[0].value,
harga:r.cells[4].children[0].value,
jumlah:r.cells[5].innerText
});
});

// ===============================
// BUAT OBJECT DATA
// ===============================
let data={
bulan:new Date().toISOString().slice(0,7),
nama:pplSelect.options[pplSelect.selectedIndex].text.split(" - ")[0],
nip:nip.value,
desa:desa.value,
bpp:bpp.value,
kecamatan:kecamatan.value,
total:total,
items:items
};

// hanya kirim files jika ada isinya
if(Object.keys(filesData).length>0){
data.files = filesData;
}

// ===============================
// FETCH KE APPS SCRIPT
// ===============================
let res=await fetch(API_URL,{
method:"POST",
body:JSON.stringify(data)
});

let hasil=await res.json();

if(hasil.status==="EXIST"){
alert("SPJ bulan ini sudah diinput");
}else{
alert("SPJ berhasil disimpan");
}

}catch(err){
alert("Gagal mengirim data");
console.error(err);
}

resetTombol(tombol);
}

// ===============================
function resetTombol(tombol){
sedangKirim=false;
tombol.disabled=false;
tombol.innerText="SIMPAN SPJ";
}
