const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');  // Store session di MongoDB
const mongoose = require('mongoose');
const { Simpan_Akun, Login_Auth, Logout_Auth, checkUserLoginStatus, loadUserData } = require('./utils/register');
const { load_Siswa,load_Guru, Simpan_siswa } = require('./utils/admin/admin');
const app = express();
const port = 3000;
const path = require('path')
const fs = require('fs')
app.use(express.static('public')); // Folder statis untuk file CSS, gambar, dll.
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Untuk memproses data dari form
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs'); // Menggunakan EJS sebagai template engine
app.use(expressLayouts); // Untuk menggunakan layout EJS

// Ganti dengan URL koneksi MongoDB Atlas Anda
const mongoUrl = "mongodb+srv://db_user:db_123@cluster0.tajkj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Menghubungkan ke MongoDB Atlas menggunakan mongoose
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.error('MongoDB Connection Error: ', err));

// Konfigurasi session menggunakan MongoDB store
app.use(session({
    secret: 'your-secret', // Ganti dengan secret key yang aman
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUrl, // URL koneksi MongoDB Atlas Anda
        collectionName: 'sessions', // Nama koleksi untuk menyimpan session
        ttl: 24 * 60 * 60, // Waktu kadaluarsa session (dalam detik), misalnya 24 jam
    }),
    cookie: {
        secure: false,  // Jika menggunakan HTTPS, set ini ke true
        maxAge: 24 * 60 * 60 * 1000, // 1 hari
    },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
// Halaman utama (index)
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layout',
        showNav: false,
        user: null // Tidak ada navigasi pada halaman utama
    });
});

// Halaman register (untuk pendaftaran pengguna baru)
app.get('/register', (req, res) => {
    res.render('register', {
        layout: 'layouts/main-layout',
        showNav: true,
        user: null
    });
});

// Halaman login
app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'layouts/main-layout',
        showNav: true,
        message: false,// Tidak ada pesan kesalahan
        user: null
    });
});
app.get('/logout', Logout_Auth, (req, res) => {
    console.log(req.session)
    // Setelah status isLoggedin diubah menjadi false, hapus session
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out.');
        }
        res.redirect('/login'); // Redirect ke halaman login setelah logout
    });
});

app.get('/guru', async (req, res) => {
    const user = req.session.user;  // Mengambil data user dari session

    if (!user || user.role !== 'guru') {
        return res.redirect('/login');  // Jika tidak ada session atau bukan admin, arahkan ke login
    }

    // Jika user berhasil login dan berperan sebagai admin
    res.render('guru', {
        layout: 'layouts/main-layout',
        showNav: true,
        user: user.role,
        username: user.username,
        email: user.email
    });
});

app.get('/siswa', async (req, res) => {
    const user = req.session.user;  // Mengambil data user dari session

    if (!user || user.role !== 'siswa') {
        return res.redirect('/login');  // Jika tidak ada session atau bukan admin, arahkan ke login
    }

    // Jika user berhasil login dan berperan sebagai admin
    res.render('siswa', {
        layout: 'layouts/main-layout',
        showNav: true,
        user: user.role,
        username: user.username,
        nama:user.nama,
        kelas:user.tingkat,
        email: user.email
    });
});
app.get('/admin', async (req, res) => {
    const user = req.session.user;  // Mengambil data user dari session

    if (!user || user.role !== 'admin') {
        return res.redirect('/login');  // Jika tidak ada session atau bukan admin, arahkan ke login
    }

    // Jika user berhasil login dan berperan sebagai admin
    res.render('admin', {
        layout: 'layouts/main-layout',
        showNav: true,
        user: user.role,
        username: user.username,
        email: user.email
    });
});
app.get('/admin/Daftar_Siswa', (req, res) => {
    const user = req.session.user;  // Mengambil data user dari session

    // Pastikan pengguna sudah login dan memiliki role admin
    if (!user || user.role !== 'admin') {
        return res.redirect('/login');  // Jika tidak login atau bukan admin, arahkan ke login
    }

    // Memuat data siswa dari fungsi load_Siswa()
    const siswaData = load_Siswa(req);

    // Menambahkan status berdasarkan isLoggedin
    const siswaWithStatus = siswaData.map(siswa => ({
        ...siswa,
        status: siswa.isLoggedin ? 'Online' : 'Offline'  // Menyatakan 'Online' jika true, 'Offline' jika false
    }));

    // Mengurutkan siswa dengan status 'Online' di atas
    const sortedSiswa = siswaWithStatus.sort((a, b) => {
        if (a.isLoggedin === b.isLoggedin) {
            return 0;  // Jika keduanya memiliki status yang sama, tidak ada perubahan urutan
        }
        return a.isLoggedin ? -1 : 1;  // Jika a 'Online', maka a akan berada di atas
    });

    // Render halaman Daftar Siswa dengan data yang valid
    res.render('admin/Daftar_siswa', {
        layout: 'layouts/main-layout',  // Layout halaman admin
        showNav: true,                  // Menampilkan navigasi
        siswa: sortedSiswa,             // Mengirim data siswa yang sudah diurutkan
        user: user.role,               
        username: user.username,        
        email: user.email,
        status: user.isLoggedin              
    });
});
app.get('/admin/Daftar_Guru', (req, res) => {
    const user = req.session.user;  // Mengambil data user dari session

    // Pastikan pengguna sudah login dan memiliki role admin
    if (!user || user.role !== 'admin') {
        return res.redirect('/login');  // Jika tidak login atau bukan admin, arahkan ke login
    }

    // Memuat data siswa dari fungsi load_Siswa()
    const guruData = load_Guru(req);
    console.log(user.isLoggedin)
    const guruWithStatus = guruData.map(guru => ({
        ...guru,
        status: guru.isLoggedin ? 'Online' : 'Offline'  // Menyatakan 'Online' jika true, 'Offline' jika false
    }));
    // Render halaman Daftar guru dengan data yang valid
    res.render('admin/Daftar_guru', {
        layout: 'layouts/main-layout',  // Layout halaman admin
        showNav: true,                  // Menampilkan navigasi
        guru: guruWithStatus,               // Data siswa yang diambil dari load_Siswa()
        user: user.role,              
        username: user.username,        
        email: user.email ,
        status: user.isLoggedin             
    });
});

// Tambah siswa
app.post('/admin/Daftar_Siswa', (req, res) => {
    const { nama, tingkat, kelas } = req.body;

    // Panggil fungsi Simpan_siswa dengan parameter nama, tingkat, dan kelas
    const result = Simpan_siswa(nama, tingkat, kelas);

    if (!result.success) {
        return res.status(500).send(result.message);
    }

    // Jika berhasil, arahkan kembali ke halaman Daftar Siswa
    res.redirect('/admin/Daftar_Siswa');
});
app.post('/register', (req,res)=>{
    const {username, email, password, role} = req.body;
    const result = Simpan_Akun(username, email, password, role);

    // Jika ada error, kirimkan pesan error
    if (!result.success) {
       res.render('register',{
        layout:'layouts/main-layout',
        showNav: true,
        message: result.message,
        success: false,
        user: result.role
    }
)}

    // Jika berhasil, arahkan pengguna ke halaman login
    res.render('login',{
        layout:'layouts/main-layout',
        showNav: true,
        message: result.message,
        success: true,
        user: result.role
    })
})
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    let result = { success: false, message: 'Role tidak ditemukan' };

    const roles = ['admin', 'guru', 'siswa'];
    let userData = {};

    for (let role of roles) {
        result = Login_Auth(username, password, role); // Tidak perlu mengirim 'kelas' lagi
        if (result.success) {
            userData = {
                username: result.username,
                role: result.role,
                isLoggedin: result.isLoggedin,
                nama: result.nama
            };

            // Tambahkan kelas untuk role siswa
            if (result.role === 'siswa') {
                userData.tingkat = result.tingkat; // Simpan kelas siswa
            }

            // Simpan data pengguna di session
            req.session.user = userData;
            console.log(req.session.user); // Cek data session

            break; // Keluar dari loop setelah login berhasil
        }
    }

    if (result.success) {
        // Setelah login berhasil, arahkan ke route yang sesuai
        res.redirect(`/${result.role}`);
    } else {
        // Jika login gagal, kembali ke halaman login dengan pesan error
        res.render('login', {
            layout: 'layouts/main-layout',
            showNav: true,
            message: result.message || 'Login gagal, silakan coba lagi.',
            success: false,
            user: null
        });
    }
});
// Jalankan aplikasi
app.listen(process.env.port || port, () => {
    console.log(`Server is running on port ${port}`);
});
