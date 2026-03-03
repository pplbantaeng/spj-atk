const API_URL = "https://script.google.com/macros/s/AKfycbxVfGC_M4RuyUnS7jMaOlmPz0tSiM0VVcaqfoxttlQvTVb9Iamg93YdXsy64b9rHIB16Q/exec";

let db=[];
let tbody=document.querySelector("#tabel tbody");
let sedangKirim = false;

// ===============================
// LOAD DATABASE PPL
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
// TABEL BARANG
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
// VALIDASI & PREVIEW LAMPIRAN
// ===============================
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

function validateFile(file, type){
if(!file) return true;

if(file.size > MAX_SIZE){
alert("Ukuran file maksimal 2MB");
return false;
}

if(type==="image" && !file.type.startsWith("image/")){
alert("File harus berupa gambar (jpg/png)");
return false;
}

if(type==="pdf" && file.type!=="application/pdf"){
alert("File harus PDF");
return false;
}

return true;
}

function setupPreview(inputId, previewId, type){

const input=document.getElementById(inputId);
const preview=document.getElementById(previewId);

input.addEventListener("change", function(){

const file=this.files[0];
if(!file) return;

if(!validateFile(file,type)){
this.value="";
preview.style.display="none";
preview.innerHTML="";
return;
}

if(type==="image"){
const reader=new FileReader();
reader.onload=function(e){
preview.src=e.target.result;
preview.style.display="block";
}
reader.readAsDataURL(file);
}

if(type==="pdf"){
preview.innerHTML="📄 "+file.name;
}

});
}

setupPreview("atk_dok","preview_atk_dok","image");
setupPreview("atk_nota","preview_atk_nota","pdf");
setupPreview("mm_dok","preview_mm_dok","image");
setupPreview("mm_nota","preview_mm_nota","pdf");

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
const atkDok = document.getElementById("atk_dok").files.length;
const atkNota = document.getElementById("atk_nota").files.length;
const mmDok = document.getElementById("mm_dok").files.length;
const mmNota = document.getElementById("mm_nota").files.length;

if(atkDok===0 && atkNota===0 && mmDok===0 && mmNota===0){
  alert("Minimal harus upload 1 lampiran (ATK atau Makan/Minum)");
  resetTombol(tombol);
  return;
}

// ===============================
// VALIDASI UKURAN FILE SAAT SIMPAN
// ===============================
const allInputs = ["atk_dok","atk_nota","mm_dok","mm_nota"];

for(let id of allInputs){
  const fileInput = document.getElementById(id);

  if(fileInput.files.length > 0){
    const file = fileInput.files[0];

    if(file.size > MAX_SIZE){
      alert("Ukuran file maksimal 2MB");
      resetTombol(tombol);
      return;
    }
  }
}

// ===============================
// VALIDASI TOTAL
// ===============================
let total = parseInt(
  document.getElementById("total")
  .innerText.replace(/\./g,'')
);
  
if(total!==100000){
alert("Total harus Rp100.000");
resetTombol(tombol);
return;
}

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

let data={
bulan:new Date().toISOString().slice(0,7),
nama:pplSelect.options[pplSelect.selectedIndex].text.split(" - ")[0],
nip:nip.value,
desa:desa.value,
bpp:bpp.value,
kecamatan:kecamatan.value,
total:total,
lampiran:"",
items:items
};

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
alert("Gagal mengirim data.");
console.error(err);
}

resetTombol(tombol);
}

function resetTombol(tombol){
sedangKirim=false;
tombol.disabled=false;
tombol.innerText="SIMPAN SPJ";
}

