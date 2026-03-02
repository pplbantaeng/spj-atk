const API_URL = "https://script.google.com/macros/s/AKfycbxVfGC_M4RuyUnS7jMaOlmPz0tSiM0VVcaqfoxttlQvTVb9Iamg93YdXsy64b9rHIB16Q/exec";

let db=[];
let tbody=document.querySelector("#tabel tbody");
let sedangKirim = false; // 🔒 anti klik berulang

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

async function kirimData(){

// 🔒 cegah klik berulang
if(sedangKirim) return;
sedangKirim = true;

const tombol = document.getElementById("btnSimpan");
tombol.disabled = true;
tombol.innerText = "Menyimpan...";

try {

let total=parseInt(
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

} catch(err){
alert("Gagal mengirim data. Periksa koneksi.");
console.error(err);
}

resetTombol(tombol);
}

// 🔄 reset tombol setelah proses
function resetTombol(tombol){
sedangKirim=false;
tombol.disabled=false;
tombol.innerText="SIMPAN SPJ";
}


