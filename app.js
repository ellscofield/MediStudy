"use strict";

/* =========================================================
   MEDISTUDY — APLIKASI UTAMA
   Penyimpanan demo menggunakan localStorage browser.
   ========================================================= */

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const STORAGE = {
    user: "ms_user",
    notes: "ms_notes",
    events: "ms_events",
    progress: "ms_course_progress",
    quiz: "ms_quiz_attempts",
    photo: "ms_profile_photo"
};

const readStorage = (key, fallback) => {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
};

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        showToast("Penyimpanan browser penuh. Hapus sebagian data lalu coba lagi.");
        return false;
    }
};

const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

const todayISO = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000)
        .toISOString()
        .slice(0, 10);
};

const formatDate = (value) => {
    if (!value) return "-";

    return new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
};

let user = readStorage(STORAGE.user, null);
let notes = readStorage(STORAGE.notes, []);
let events = readStorage(STORAGE.events, []);
let courseProgress = readStorage(STORAGE.progress, {});
let quizAttempts = readStorage(STORAGE.quiz, 0);
let savedPhoto = localStorage.getItem(STORAGE.photo) || "";

let activeCourse = null;
let toastTimer = null;
let editingPhoto = null;

/* =========================================
   NAVIGASI SUBBAB MEDISTUDY
   ========================================= */

function renderLessonNavigation(course, lessonIndex) {
    const chapterList = document.getElementById("lessonChapterList");
    const previousButton = document.getElementById("previousLesson");
    const nextButton = document.getElementById("nextLesson");

    if (!chapterList || !previousButton || !nextButton || !course) {
        return;
    }

    chapterList.replaceChildren();

    course.lessons.forEach((lesson, index) => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "lesson-chapter-button";
        button.textContent = `${index + 1}. ${lesson.title}`;

        if (index === lessonIndex) {
            button.classList.add("active");
            button.setAttribute("aria-current", "step");
        }

        button.addEventListener("click", () => {
            openCourse(course.id, index);
        });

        chapterList.appendChild(button);
    });

    previousButton.disabled = lessonIndex <= 0;
    nextButton.disabled = lessonIndex >= course.lessons.length - 1;
}

/* Navigasi sebelumnya */
document.getElementById("previousLesson")?.addEventListener("click", () => {
    if (!activeCourse || activeLessonIndex <= 0) {
        return;
    }

    openCourse(activeCourse.id, activeLessonIndex - 1);
});

/* Navigasi berikutnya */
document.getElementById("nextLesson")?.addEventListener("click", () => {
    if (!activeCourse || activeLessonIndex >= activeCourse.lessons.length - 1) {
        return;
    }

    openCourse(activeCourse.id, activeLessonIndex + 1);
});

/* =========================================================
   DATA MATERI MEDISTUDY — AKADEMIK
   ========================================================= */

const courses = [
    {
        id: "anatomi",
        title: "Dasar Anatomi Manusia",
        category: "Anatomi",
        icon: "🫀",
        color: "#eeeaff",
        accent: "#6257e8",
        description: "Mengenal struktur tubuh dan organ manusia.",
        duration: "20 menit",
        lessons: [
            {
                title: "Pengantar anatomi",
                content: [
                    "Anatomi adalah cabang ilmu biologi dan kedokteran yang mempelajari struktur tubuh manusia, termasuk bentuk, letak, hubungan antarorgan, serta susunan bagian tubuh. Anatomi menjadi dasar untuk memahami fungsi normal tubuh dan perubahan struktur akibat penyakit atau cedera.",
                    "Organisasi tubuh manusia terdiri atas beberapa tingkat. Sel merupakan unit struktural dan fungsional terkecil. Sekumpulan sel sejenis membentuk jaringan, beberapa jaringan membentuk organ, beberapa organ bekerja sama dalam sistem organ, dan seluruh sistem organ membentuk organisme.",
                    "Tubuh mempertahankan kondisi internal melalui homeostasis, yaitu pengaturan lingkungan internal agar tetap berada dalam rentang yang mendukung fungsi normal. Contohnya adalah pengaturan suhu tubuh, kadar glukosa darah, keseimbangan cairan, dan tekanan darah.",
                    "Anatomi dapat dipelajari melalui pendekatan regional, yaitu berdasarkan wilayah tubuh seperti kepala, dada, dan perut, atau pendekatan sistemik, yaitu berdasarkan sistem organ seperti sistem saraf, pencernaan, dan pernapasan."
                ]
            },
            {
                title: "Sistem organ",
                content: [
                    "Sistem organ adalah kumpulan organ yang saling berkoordinasi untuk menjalankan fungsi fisiologis tertentu. Sistem tersebut tidak bekerja secara terpisah, tetapi berinteraksi untuk mempertahankan kehidupan dan keseimbangan internal tubuh.",
                    "Sistem pencernaan mengolah makanan menjadi zat yang dapat diserap. Sistem pernapasan mengambil oksigen dan mengeluarkan karbon dioksida. Sistem peredaran darah mengangkut oksigen, zat gizi, hormon, dan produk sisa metabolisme ke berbagai bagian tubuh.",
                    "Sistem saraf dan sistem endokrin mengatur serta mengoordinasikan aktivitas tubuh. Sistem ekskresi membantu mengeluarkan sisa metabolisme dan mengatur keseimbangan air serta elektrolit. Sistem muskuloskeletal mendukung gerakan, postur, dan perlindungan organ.",
                    "Sebagai contoh, ketika seseorang berlari, sistem saraf mengoordinasikan gerakan, sistem muskuloskeletal menghasilkan kontraksi, sistem pernapasan meningkatkan ventilasi, dan sistem peredaran darah meningkatkan pengiriman oksigen ke otot."
                ]
            }
        ]
    },
    {
        id: "gizi",
        title: "Gizi Seimbang",
        category: "Gizi",
        icon: "🥗",
        color: "#e2f7ec",
        accent: "#23966b",
        description: "Pelajari nutrisi dan kebiasaan makan yang baik.",
        duration: "15 menit",
        lessons: [
            {
                title: "Mengenal zat gizi",
                content: [
                    "Zat gizi adalah komponen dalam makanan yang dibutuhkan tubuh untuk menghasilkan energi, membangun dan memperbaiki jaringan, serta mengatur proses fisiologis. Kebutuhan zat gizi berbeda berdasarkan usia, jenis kelamin, tingkat aktivitas, dan kondisi kesehatan.",
                    "Karbohidrat merupakan salah satu sumber energi utama. Protein berperan dalam pembentukan dan perbaikan jaringan serta produksi enzim dan hormon. Lemak menyediakan energi, membantu penyerapan vitamin larut lemak, dan menjadi bagian dari membran sel.",
                    "Vitamin dan mineral diperlukan dalam berbagai proses metabolisme. Vitamin memiliki fungsi yang beragam, sedangkan mineral berperan antara lain dalam pembentukan tulang, fungsi saraf, kontraksi otot, dan pembentukan sel darah. Air membantu mengatur suhu tubuh, mengangkut zat, dan mempertahankan keseimbangan cairan.",
                    "Kekurangan maupun kelebihan asupan zat gizi tertentu dapat berdampak terhadap kesehatan. Oleh karena itu, pola makan sebaiknya bervariasi dan disesuaikan dengan kebutuhan individu, bukan hanya berfokus pada satu jenis makanan atau suplemen."
                ]
            },
            {
                title: "Prinsip gizi seimbang",
                content: [
                    "Gizi seimbang merupakan pola konsumsi yang menyediakan zat gizi sesuai kebutuhan tubuh dengan memperhatikan variasi makanan, kebersihan, aktivitas fisik, dan pemantauan berat badan secara sehat.",
                    "Pedoman Isi Piringku dari Kementerian Kesehatan Republik Indonesia dapat digunakan sebagai gambaran praktis komposisi makan. Secara umum, setengah piring diisi sayur dan buah, sedangkan setengah lainnya diisi makanan pokok dan lauk-pauk. Proporsi tepat tetap perlu menyesuaikan kebutuhan individu.",
                    "Biasakan mengonsumsi sumber karbohidrat, protein, sayuran, buah, serta air minum yang cukup. Batasi konsumsi gula, garam, dan lemak berlebihan. Perhatikan pula keamanan pangan, kebersihan bahan makanan, dan cara pengolahan.",
                    "Aktivitas fisik teratur dan tidur cukup merupakan bagian dari kebiasaan sehat. Tidak ada satu jenis makanan yang dapat memenuhi seluruh kebutuhan zat gizi. Pola makan yang baik dinilai berdasarkan keseluruhan kebiasaan dan kecukupan asupan dari waktu ke waktu."
                ]
            }
        ]
    },
    {
        id: "pertolongan",
        title: "Pertolongan Pertama",
        category: "Pertolongan Pertama",
        icon: "🩹",
        color: "#fff0e2",
        accent: "#d78334",
        description: "Pahami langkah awal saat menghadapi keadaan darurat.",
        duration: "25 menit",
        lessons: [
            {
                title: "Menilai situasi",
                content: [
                    "Pertolongan pertama adalah bantuan awal yang diberikan kepada orang sakit atau cedera sebelum memperoleh penanganan lanjutan. Tujuannya adalah menjaga keselamatan, mencegah kondisi memburuk, dan mendukung pemulihan.",
                    "Langkah awal adalah memastikan keamanan lokasi. Perhatikan kemungkinan bahaya seperti lalu lintas, listrik, kebakaran, bahan kimia, atau kekerasan. Jangan memasuki area berbahaya tanpa perlindungan dan pelatihan yang sesuai.",
                    "Periksa respons korban dan kondisi pernapasannya tanpa menunda permintaan bantuan. Minta seseorang menghubungi layanan darurat setempat dan mengambil alat pertolongan pertama atau AED jika tersedia. Jika korban tidak responsif dan tidak bernapas normal, ikuti instruksi petugas darurat serta mulai CPR jika mampu.",
                    "Hindari memindahkan korban yang dicurigai mengalami cedera kepala, leher, atau tulang belakang kecuali terdapat bahaya langsung. Jangan memberikan makanan atau minuman kepada korban yang tidak sadar. Penanganan harus disesuaikan dengan kondisi korban dan tingkat pelatihan penolong."
                ]
            },
            {
                title: "Luka ringan",
                content: [
                    "Luka adalah kerusakan pada kulit atau jaringan di bawahnya. Luka ringan dapat berupa lecet, goresan, atau sayatan kecil. Penilaian awal perlu memperhatikan lokasi, kedalaman, tingkat perdarahan, serta kemungkinan adanya benda asing atau kontaminasi.",
                    "Pastikan lingkungan aman dan cuci tangan sebelum menangani luka. Jika terjadi perdarahan, tekan luka menggunakan kasa steril atau kain bersih secara langsung dan berkelanjutan. Jika darah menembus balutan, tambahkan lapisan di atasnya tanpa sering mengangkat balutan pertama.",
                    "Setelah perdarahan terkendali, bersihkan luka kecil menggunakan air bersih yang mengalir dan tutup dengan balutan steril. Hindari menuangkan bahan kimia keras ke dalam luka. Ganti balutan jika basah atau kotor dan amati tanda peradangan yang memburuk.",
                    "Segera cari bantuan medis untuk perdarahan berat atau yang tidak berhenti, luka dalam atau menganga, luka gigitan, benda tertancap, gangguan fungsi, atau tanda infeksi seperti kemerahan yang meluas, pembengkakan, nyeri yang meningkat, dan nanah. Status imunisasi tetanus juga perlu dipertimbangkan."
                ]
            }
        ]
    },
    {
        id: "pernapasan",
        title: "Sistem Pernapasan",
        category: "Anatomi",
        icon: "🫁",
        color: "#e2f2ff",
        accent: "#398acb",
        description: "Pelajari bagaimana tubuh mengambil dan menggunakan oksigen.",
        duration: "18 menit",
        lessons: [
            {
                title: "Organ pernapasan",
                content: [
                    "Sistem pernapasan berfungsi memasukkan oksigen ke dalam tubuh dan mengeluarkan karbon dioksida. Struktur utamanya meliputi hidung, rongga hidung, faring, laring, trakea, bronkus, bronkiolus, dan alveolus di paru-paru.",
                    "Rongga hidung membantu menyaring, menghangatkan, dan melembapkan udara. Trakea menyalurkan udara menuju bronkus, yang bercabang menjadi saluran lebih kecil di dalam paru-paru. Mukus dan silia membantu menangkap serta menggerakkan partikel keluar dari saluran pernapasan.",
                    "Alveolus merupakan kantung udara kecil yang dikelilingi jaringan kapiler. Dinding alveolus dan kapiler yang tipis memungkinkan pertukaran gas melalui difusi. Oksigen bergerak dari udara alveolus ke darah, sedangkan karbon dioksida bergerak dari darah menuju alveolus untuk dikeluarkan.",
                    "Efisiensi pertukaran gas dipengaruhi luas permukaan alveolus, ketebalan membran, perbedaan tekanan parsial gas, dan aliran darah kapiler. Kerusakan pada jaringan paru atau gangguan ventilasi dapat mengurangi kemampuan tubuh memperoleh oksigen."
                ]
            },
            {
                title: "Proses bernapas",
                content: [
                    "Ventilasi adalah proses masuk dan keluarnya udara dari paru-paru. Inspirasi atau menarik napas terjadi ketika diafragma berkontraksi dan bergerak ke bawah. Otot antartulang rusuk tertentu turut mengangkat tulang rusuk sehingga volume rongga dada meningkat.",
                    "Ketika volume rongga dada bertambah, tekanan di dalam paru-paru menurun relatif terhadap tekanan udara luar sehingga udara masuk. Saat ekspirasi normal, diafragma mengendur, volume rongga dada berkurang, dan udara keluar karena perbedaan tekanan.",
                    "Ventilasi berbeda dari respirasi eksternal dan respirasi internal. Respirasi eksternal merupakan pertukaran gas antara alveolus dan darah, sedangkan respirasi internal adalah pertukaran gas antara darah dan jaringan. Selanjutnya, oksigen digunakan dalam respirasi seluler untuk membantu menghasilkan ATP.",
                    "Pusat pengaturan pernapasan di batang otak menyesuaikan frekuensi dan kedalaman napas berdasarkan kebutuhan tubuh. Perubahan kadar karbon dioksida dan pH darah merupakan faktor penting dalam pengaturan tersebut."
                ]
            }
        ]
    },
    {
        id: "kebersihan",
        title: "Kebersihan dan Pencegahan Penyakit",
        category: "Kesehatan Umum",
        icon: "🧼",
        color: "#ffebf0",
        accent: "#d65b7a",
        description: "Kenali kebiasaan yang mendukung kesehatan sehari-hari.",
        duration: "12 menit",
        lessons: [
            {
                title: "Kebersihan tangan",
                content: [
                    "Kebersihan tangan merupakan langkah penting untuk mengurangi penyebaran mikroorganisme penyebab penyakit. Tangan dapat memindahkan mikroorganisme dari permukaan yang terkontaminasi ke mata, hidung, mulut, makanan, atau orang lain.",
                    "Cuci tangan menggunakan sabun dan air mengalir, terutama ketika tangan terlihat kotor, sebelum makan atau menyiapkan makanan, setelah menggunakan toilet, serta setelah batuk, bersin, atau membersihkan kotoran.",
                    "Basahi tangan, gunakan sabun, lalu gosok telapak, punggung tangan, sela jari, ibu jari, ujung jari, dan area sekitar kuku. Gosok seluruh permukaan selama sekitar 20 detik, bilas dengan air mengalir, lalu keringkan menggunakan cara yang bersih.",
                    "Jika sabun dan air tidak tersedia, pembersih tangan berbasis alkohol setidaknya 60% dapat digunakan pada kondisi yang sesuai. Produk tersebut tidak selalu efektif terhadap semua jenis kuman dan kurang sesuai jika tangan tampak kotor atau berminyak."
                ]
            },
            {
                title: "Kebiasaan sehat",
                content: [
                    "Pencegahan penyakit dilakukan melalui kombinasi perilaku individu dan lingkungan yang mendukung kesehatan. Kebiasaan penting meliputi pola makan seimbang, aktivitas fisik, tidur cukup, kebersihan diri, dan pengelolaan stres.",
                    "Kebersihan lingkungan mencakup pengelolaan sampah, sanitasi yang memadai, air bersih, ventilasi yang baik, serta pengendalian sumber penyakit seperti nyamuk. Kebiasaan menutup mulut dan hidung saat batuk atau bersin juga membantu mengurangi penyebaran partikel pernapasan.",
                    "Vaksinasi sesuai rekomendasi tenaga kesehatan dapat melatih sistem kekebalan untuk mengenali patogen tertentu dan menurunkan risiko penyakit atau komplikasi. Jadwal vaksinasi dapat berbeda berdasarkan usia, riwayat imunisasi, kondisi kesehatan, dan pedoman yang berlaku.",
                    "Antibiotik digunakan untuk menangani infeksi bakteri tertentu sesuai penilaian tenaga kesehatan. Antibiotik tidak bekerja untuk infeksi virus seperti sebagian besar kasus pilek. Penggunaan yang tidak tepat dapat mendorong resistansi antimikroba, sehingga obat harus digunakan sesuai resep dan petunjuk."
                ]
            }
        ]
    },
    {
        id: "jantung",
        title: "Dasar Sistem Peredaran Darah",
        category: "Anatomi",
        icon: "❤️",
        color: "#ffe9e9",
        accent: "#d94e63",
        description: "Memahami fungsi jantung dan pembuluh darah.",
        duration: "20 menit",
        lessons: [
            {
                title: "Fungsi jantung",
                content: [
                    "Jantung adalah organ berotot yang memompa darah melalui sistem peredaran darah. Jantung manusia memiliki empat ruang: atrium kanan, ventrikel kanan, atrium kiri, dan ventrikel kiri. Katup jantung membantu menjaga aliran darah tetap satu arah.",
                    "Darah dari tubuh memasuki atrium kanan melalui vena kava, kemudian bergerak ke ventrikel kanan dan dipompa melalui arteri pulmonalis menuju paru-paru. Di paru-paru, darah melepaskan karbon dioksida dan mengambil oksigen.",
                    "Darah beroksigen kembali ke atrium kiri melalui vena pulmonalis, diteruskan ke ventrikel kiri, lalu dipompa melalui aorta menuju jaringan tubuh. Sirkulasi pulmonal menghubungkan jantung dan paru-paru, sedangkan sirkulasi sistemik menghubungkan jantung dengan sebagian besar jaringan tubuh.",
                    "Siklus jantung terdiri atas fase relaksasi atau diastol dan kontraksi atau sistol. Aktivitas listrik yang dihasilkan sistem konduksi jantung membantu mengoordinasikan kontraksi. Frekuensi denyut, volume sekuncup, dan resistansi pembuluh memengaruhi aliran darah serta tekanan darah."
                ]
            },
            {
                title: "Pembuluh darah",
                content: [
                    "Pembuluh darah terdiri atas arteri, arteriol, kapiler, venula, dan vena. Arteri membawa darah menjauhi jantung, sedangkan vena membawa darah kembali ke jantung. Penamaan pembuluh ditentukan oleh arah aliran terhadap jantung, bukan semata-mata kadar oksigennya.",
                    "Arteri memiliki dinding relatif tebal dan elastis untuk menghadapi tekanan darah yang lebih tinggi. Arteriol membantu mengatur distribusi aliran darah dan resistansi pembuluh. Kapiler memiliki dinding sangat tipis yang mendukung pertukaran gas, zat gizi, cairan, dan produk sisa metabolisme.",
                    "Vena memiliki tekanan lebih rendah dan berfungsi mengembalikan darah ke jantung. Pada beberapa vena, katup membantu mencegah aliran balik. Kontraksi otot rangka dan perubahan tekanan saat bernapas turut membantu aliran balik vena.",
                    "Kesehatan sistem peredaran darah dipengaruhi banyak faktor, termasuk aktivitas fisik, pola makan, merokok, kualitas tidur, tekanan darah, kadar lipid, dan kondisi medis. Pemeriksaan serta pengelolaan faktor risiko dapat membantu menjaga kesehatan kardiovaskular."
                ]
            }
        ]
    }
];

/* =========================================================
   DETAIL AKADEMIK SETIAP MATERI
   ========================================================= */

const academicDetails = {
    anatomi: {
        objectives: [
            "Menjelaskan pengertian dan ruang lingkup anatomi manusia.",
            "Mengurutkan tingkat organisasi struktural tubuh.",
            "Menjelaskan hubungan sistem organ dan homeostasis."
        ],
        visual: {
            title: "Tingkat organisasi tubuh",
            steps: [
                "Sel",
                "Jaringan",
                "Organ",
                "Sistem organ",
                "Organisme"
            ],
            caption: "Struktur tubuh tersusun secara hierarkis. Setiap tingkat bergantung pada tingkat di bawahnya."
        },
        terms: [
            {
                term: "Anatomi",
                definition: "Ilmu yang mempelajari struktur dan susunan tubuh."
            },
            {
                term: "Fisiologi",
                definition: "Ilmu yang mempelajari fungsi normal tubuh dan bagian-bagiannya."
            },
            {
                term: "Homeostasis",
                definition: "Pemeliharaan kondisi internal tubuh dalam rentang yang relatif stabil."
            },
            {
                term: "Jaringan",
                definition: "Kumpulan sel dan bahan antarsel yang bekerja menjalankan fungsi tertentu."
            },
            {
                term: "Organ",
                definition: "Struktur yang tersusun atas beberapa jenis jaringan dan menjalankan fungsi tertentu."
            }
        ],
        lessons: [
            {
                takeaway: "Anatomi mempelajari struktur tubuh, sedangkan fisiologi mempelajari fungsinya. Keduanya saling melengkapi dalam memahami kesehatan manusia."
            },
            {
                takeaway: "Sistem organ bekerja secara terpadu. Perubahan pada satu sistem dapat memengaruhi fungsi sistem lainnya."
            }
        ],
        references: [
            {
                title: "OpenStax — Anatomy and Physiology 2e",
                url: "https://openstax.org/details/books/anatomy-and-physiology-2e"
            },
            {
                title: "MedlinePlus — Body Location and Organization",
                url: "https://medlineplus.gov/"
            }
        ]
    },

    gizi: {
        objectives: [
            "Mengidentifikasi kelompok zat gizi dan fungsi utamanya.",
            "Menjelaskan prinsip pola makan seimbang.",
            "Menerapkan konsep variasi pangan dan kebiasaan hidup sehat."
        ],
        visual: {
            title: "Komponen pola makan seimbang",
            steps: [
                "Variasi makanan",
                "Zat gizi sesuai kebutuhan",
                "Porsi seimbang",
                "Aktivitas fisik",
                "Kesehatan berkelanjutan"
            ],
            caption: "Gizi seimbang merupakan bagian dari pola hidup sehat, bukan sekadar memilih satu jenis makanan."
        },
        terms: [
            {
                term: "Makronutrien",
                definition: "Zat gizi yang dibutuhkan dalam jumlah relatif besar, seperti karbohidrat, protein, dan lemak."
            },
            {
                term: "Mikronutrien",
                definition: "Vitamin dan mineral yang dibutuhkan dalam jumlah relatif kecil untuk fungsi tubuh."
            },
            {
                term: "Metabolisme",
                definition: "Keseluruhan reaksi kimia yang berlangsung di dalam tubuh."
            },
            {
                term: "Serat pangan",
                definition: "Komponen pangan nabati yang tidak sepenuhnya dicerna oleh enzim pencernaan manusia."
            },
            {
                term: "Gizi seimbang",
                definition: "Susunan konsumsi yang memenuhi kebutuhan zat gizi dengan memperhatikan variasi, kebersihan, dan aktivitas fisik."
            }
        ],
        lessons: [
            {
                takeaway: "Karbohidrat, protein, lemak, vitamin, mineral, dan air memiliki fungsi berbeda. Variasi makanan membantu memenuhi kebutuhan zat gizi."
            },
            {
                takeaway: "Pola makan sehat perlu disertai aktivitas fisik, hidrasi, dan kebersihan pangan. Kebutuhan individu dapat berbeda."
            }
        ],
        references: [
            {
                title: "WHO — Healthy Diet",
                url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet"
            },
            {
                title: "Kementerian Kesehatan RI",
                url: "https://ayosehat.kemkes.go.id/"
            }
        ]
    },

    pertolongan: {
        objectives: [
            "Menjelaskan tujuan dan prinsip keselamatan pertolongan pertama.",
            "Mengidentifikasi kondisi yang memerlukan bantuan darurat.",
            "Menjelaskan penanganan awal luka ringan dan tanda bahaya."
        ],
        visual: {
            title: "Urutan awal pertolongan pertama",
            steps: [
                "Pastikan lokasi aman",
                "Periksa respons",
                "Panggil bantuan",
                "Berikan pertolongan sesuai kemampuan",
                "Pantau kondisi korban"
            ],
            caption: "Keselamatan penolong dan korban menjadi prioritas. Ikuti instruksi petugas darurat untuk situasi yang mengancam jiwa."
        },
        terms: [
            {
                term: "Pertolongan pertama",
                definition: "Bantuan awal untuk menjaga keselamatan dan mencegah kondisi korban memburuk."
            },
            {
                term: "CPR / RJP",
                definition: "Resusitasi jantung paru untuk membantu sirkulasi dan pernapasan pada kondisi henti jantung."
            },
            {
                term: "AED",
                definition: "Alat kejut jantung otomatis yang menganalisis irama jantung dan memberikan instruksi penggunaan."
            },
            {
                term: "Perdarahan",
                definition: "Keluarnya darah dari pembuluh darah akibat cedera atau kondisi medis."
            },
            {
                term: "Steril",
                definition: "Keadaan bebas dari mikroorganisme hidup; dalam pertolongan luka, gunakan bahan balutan steril bila tersedia."
            }
        ],
        lessons: [
            {
                takeaway: "Jangan membahayakan diri sendiri saat menolong. Kenali keadaan darurat, panggil bantuan, dan berikan tindakan sesuai pelatihan."
            },
            {
                takeaway: "Tekanan langsung dengan bahan bersih membantu menangani perdarahan ringan. Luka berat atau perdarahan yang tidak berhenti memerlukan pertolongan medis segera."
            }
        ],
        references: [
            {
                title: "American Red Cross — First Aid",
                url: "https://www.redcross.org/take-a-class/first-aid"
            },
            {
                title: "NHS — First Aid",
                url: "https://www.nhs.uk/conditions/first-aid/"
            }
        ]
    },

    pernapasan: {
        objectives: [
            "Mengidentifikasi struktur utama sistem pernapasan.",
            "Menjelaskan mekanisme inspirasi dan ekspirasi.",
            "Membedakan ventilasi dan pertukaran gas."
        ],
        visual: {
            title: "Jalur udara dan pertukaran gas",
            steps: [
                "Hidung / rongga hidung",
                "Faring dan laring",
                "Trakea dan bronkus",
                "Bronkiolus",
                "Alveolus ↔ kapiler darah"
            ],
            caption: "Udara mencapai alveolus. Oksigen berdifusi ke darah dan karbon dioksida berdifusi ke alveolus."
        },
        terms: [
            {
                term: "Ventilasi",
                definition: "Pergerakan udara masuk dan keluar dari paru-paru."
            },
            {
                term: "Alveolus",
                definition: "Kantung udara mikroskopis tempat pertukaran gas di paru-paru."
            },
            {
                term: "Difusi",
                definition: "Perpindahan partikel mengikuti gradien konsentrasi atau tekanan parsial."
            },
            {
                term: "Diafragma",
                definition: "Otot utama pernapasan yang memisahkan rongga dada dan rongga perut."
            },
            {
                term: "Respirasi seluler",
                definition: "Proses sel menggunakan energi kimia dari zat gizi untuk menghasilkan ATP."
            }
        ],
        lessons: [
            {
                takeaway: "Alveolus menyediakan permukaan pertukaran gas yang luas dan berdekatan dengan kapiler darah."
            },
            {
                takeaway: "Perubahan volume rongga dada mengubah tekanan sehingga udara bergerak masuk atau keluar dari paru-paru."
            }
        ],
        references: [
            {
                title: "OpenStax — Anatomy and Physiology 2e",
                url: "https://openstax.org/details/books/anatomy-and-physiology-2e"
            },
            {
                title: "MedlinePlus — Lungs and Breathing",
                url: "https://medlineplus.gov/lungsandbreathing.html"
            }
        ]
    },

    kebersihan: {
        objectives: [
            "Menjelaskan peran kebersihan tangan dalam pencegahan infeksi.",
            "Mengidentifikasi kebiasaan yang mendukung kesehatan.",
            "Membedakan penggunaan antibiotik untuk infeksi bakteri dan virus."
        ],
        visual: {
            title: "Rantai pencegahan penyakit",
            steps: [
                "Kenali sumber mikroorganisme",
                "Putus jalur penularan",
                "Terapkan kebersihan",
                "Lindungi individu berisiko",
                "Kurangi risiko infeksi"
            ],
            caption: "Kebersihan tangan, sanitasi, vaksinasi, dan perilaku sehat dapat membantu mengurangi risiko penyakit."
        },
        terms: [
            {
                term: "Patogen",
                definition: "Agen biologis yang dapat menyebabkan penyakit."
            },
            {
                term: "Transmisi",
                definition: "Proses perpindahan agen penyebab penyakit dari sumber ke inang."
            },
            {
                term: "Sanitasi",
                definition: "Upaya menjaga lingkungan dan fasilitas agar mendukung kesehatan masyarakat."
            },
            {
                term: "Vaksinasi",
                definition: "Pemberian vaksin untuk membantu membentuk perlindungan kekebalan terhadap penyakit tertentu."
            },
            {
                term: "Resistansi antimikroba",
                definition: "Kemampuan mikroorganisme untuk bertahan terhadap obat yang sebelumnya efektif."
            }
        ],
        lessons: [
            {
                takeaway: "Cuci tangan dengan teknik yang benar dan pada waktu yang tepat membantu memutus jalur penularan mikroorganisme."
            },
            {
                takeaway: "Pencegahan penyakit memerlukan kebiasaan individu dan lingkungan yang sehat. Gunakan antibiotik hanya sesuai arahan tenaga kesehatan."
            }
        ],
        references: [
            {
                title: "WHO — Hand Hygiene",
                url: "https://www.who.int/health-topics/hand-hygiene"
            },
            {
                title: "WHO — Antimicrobial Resistance",
                url: "https://www.who.int/news-room/fact-sheets/detail/antimicrobial-resistance"
            },
            {
                title: "Kementerian Kesehatan RI",
                url: "https://ayosehat.kemkes.go.id/"
            }
        ]
    },

    jantung: {
        objectives: [
            "Mengidentifikasi ruang dan katup utama jantung.",
            "Menjelaskan aliran darah pada sirkulasi pulmonal dan sistemik.",
            "Membedakan fungsi arteri, vena, dan kapiler."
        ],
        visual: {
            title: "Alur sirkulasi darah",
            steps: [
                "Tubuh",
                "Vena kava",
                "Jantung kanan",
                "Paru-paru",
                "Jantung kiri",
                "Aorta → tubuh"
            ],
            caption: "Sirkulasi pulmonal menghubungkan jantung dengan paru-paru. Sirkulasi sistemik menghubungkan jantung dengan jaringan tubuh."
        },
        terms: [
            {
                term: "Atrium",
                definition: "Ruang atas jantung yang menerima darah."
            },
            {
                term: "Ventrikel",
                definition: "Ruang bawah jantung yang memompa darah keluar dari jantung."
            },
            {
                term: "Sistol",
                definition: "Fase kontraksi jantung untuk mendorong darah."
            },
            {
                term: "Diastol",
                definition: "Fase relaksasi jantung ketika ruang jantung terisi darah."
            },
            {
                term: "Kapiler",
                definition: "Pembuluh darah kecil dengan dinding tipis yang memungkinkan pertukaran zat antara darah dan jaringan."
            }
        ],
        lessons: [
            {
                takeaway: "Jantung kanan memompa darah menuju paru-paru, sedangkan jantung kiri memompa darah ke sirkulasi sistemik."
            },
            {
                takeaway: "Arteri membawa darah menjauhi jantung, vena membawa darah kembali, dan kapiler menjadi tempat pertukaran zat."
            }
        ],
        references: [
            {
                title: "OpenStax — Anatomy and Physiology 2e",
                url: "https://openstax.org/details/books/anatomy-and-physiology-2e"
            },
            {
                title: "MedlinePlus — Heart and Blood Vessels",
                url: "https://medlineplus.gov/heartandbloodvessels.html"
            }
        ]
    }
};

/* =========================================================
   PROGRES BELAJAR — STRUKTUR LAMA DIPERTAHANKAN
   ========================================================= */

const defaultProgress = () => {
    const result = {};

    courses.forEach((course) => {
        result[course.id] = [];
    });

    return result;
};

courses.forEach((course) => {
    if (!Array.isArray(courseProgress[course.id])) {
        courseProgress[course.id] = [];
    }

    // Hanya pertahankan indeks pelajaran yang valid.
    courseProgress[course.id] = [
        ...new Set(
            courseProgress[course.id].filter(
                (index) =>
                    Number.isInteger(index) &&
                    index >= 0 &&
                    index < course.lessons.length
            )
        )
    ];
});

writeStorage(STORAGE.progress, courseProgress);

/* =========================================================
   DATA LATIHAN SOAL
   ========================================================= */

const questions = [
    {
        question: "Apa unit struktural dasar kehidupan?",
        options: ["Organ", "Sel", "Sistem organ", "Jaringan"],
        answer: 1,
        explanation: "Sel adalah unit struktural dan fungsional dasar kehidupan."
    },
    {
        question: "Organ utama yang memompa darah adalah...",
        options: ["Paru-paru", "Ginjal", "Jantung", "Lambung"],
        answer: 2,
        explanation: "Jantung memompa darah menuju paru-paru dan seluruh tubuh."
    },
    {
        question: "Di bagian paru-paru manakah pertukaran gas berlangsung?",
        options: ["Trakea", "Alveolus", "Faring", "Laring"],
        answer: 1,
        explanation: "Alveolus merupakan tempat pertukaran oksigen dan karbon dioksida."
    },
    {
        question: "Zat gizi yang terutama berfungsi membangun dan memperbaiki jaringan adalah...",
        options: ["Protein", "Air", "Vitamin", "Mineral"],
        answer: 0,
        explanation: "Protein berperan dalam pembentukan dan perbaikan jaringan tubuh."
    },
    {
        question: "Apa yang perlu dilakukan sebelum menolong korban di lokasi kejadian?",
        options: [
            "Langsung memindahkan korban",
            "Memberikan makanan",
            "Memastikan lokasi aman",
            "Meninggalkan lokasi"
        ],
        answer: 2,
        explanation: "Keselamatan penolong dan keamanan lingkungan perlu dinilai terlebih dahulu."
    }
];

let quizIndex = 0;
let quizScore = 0;
let selectedAnswer = null;
let answered = false;

/* =========================================================
   NOTIFIKASI
   ========================================================= */

function showToast(message) {
    const toast = $("#toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

/* =========================================================
   LOGIN DAN PROFIL
   ========================================================= */

function showApplication() {
    $("#loginScreen").classList.add("hidden");
    $("#appShell").classList.remove("hidden");

    updateUserInterface();
    showPage("dashboard");
}


function updateUserInterface() {
    const name = user?.name || "Pengguna";
    const initial = name.trim().charAt(0).toUpperCase() || "M";

    // Mengubah elemen teks jika elemennya tersedia.
    const setText = (selector, value) => {
        const element = $(selector);
        if (element) element.textContent = value;
    };

    // Mengubah nilai input jika elemennya tersedia.
    const setValue = (selector, value) => {
        const element = $(selector);
        if (element) element.value = value;
    };

    setText("#welcomeName", name);
    setText("#sidebarName", name);
    setText("#profileDisplayName", name);

    setValue("#profileName", name);
    setValue("#profileGoal", user?.goal || "30 menit sehari");
    setValue("#profileAbout", user?.about || "");

    setText("#sidebarAvatar", initial);
    setText("#topAvatar", initial);
    setText("#profileAvatar", initial);

    const profilePhoto = $("#profilePhoto");
    const profileAvatar = $("#profileAvatar");
    const topAvatar = $("#topAvatar");
    const sidebarAvatar = $("#sidebarAvatar");

    if (savedPhoto) {
        if (profilePhoto) {
            profilePhoto.src = savedPhoto;
            profilePhoto.classList.remove("hidden");
        }

        if (profileAvatar) {
            profileAvatar.classList.add("hidden");
        }

        if (topAvatar) {
            topAvatar.innerHTML =
                `<img class="avatar-photo" src="${savedPhoto}" alt="">`;
        }

        if (sidebarAvatar) {
            sidebarAvatar.innerHTML =
                `<img class="avatar-photo" src="${savedPhoto}" alt="">`;
        }
    } else {
        if (profilePhoto) {
            profilePhoto.classList.add("hidden");
        }

        if (profileAvatar) {
            profileAvatar.classList.remove("hidden");
        }
    }
}

$("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#usernameInput").value.trim();

    if (!name) {
        showToast("Masukkan namamu terlebih dahulu.");
        return;
    }

    user = {
        ...user,
        name,
        goal: user?.goal || "30 menit sehari",
        about: user?.about || ""
    };

    if (!writeStorage(STORAGE.user, user)) return;

    showApplication();
    showToast(`Selamat datang di MediStudy, ${name}!`);
});

$("#logoutButton").addEventListener("click", () => {
    $("#appShell").classList.add("hidden");
    $("#loginScreen").classList.remove("hidden");
    $("#usernameInput").value = user?.name || "";
    $("#sidebar").classList.remove("open");
});

$("#profileForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#profileName").value.trim();

    if (!name) {
        showToast("Nama tidak boleh kosong.");
        return;
    }

    const previousUser = user;

    user = {
        ...user,
        name,
        goal: $("#profileGoal").value,
        about: $("#profileAbout").value.trim()
    };

    if (!writeStorage(STORAGE.user, user)) {
        user = previousUser;
        return;
    }

    updateUserInterface();
    showToast("Profil berhasil disimpan.");
});

/* =========================================================
   NAVIGASI
   ========================================================= */

const pageTitles = {
    dashboard: "Dashboard",
    materi: "Jelajah Materi",
    catatan: "Catatan Saya",
    kalender: "Kalender Belajar",
    latihan: "Latihan Soal",
    progres: "Progres Belajar",
    profil: "Profil Saya"
};

function showPage(pageName) {
    if (!pageTitles[pageName]) return;

    $$(".page").forEach((page) => {
        page.classList.toggle("active", page.id === `page-${pageName}`);
    });

    $$(".nav-link").forEach((button) => {
        button.classList.toggle("active", button.dataset.page === pageName);
    });

    $("#pageHeading").textContent = pageTitles[pageName];
    $("#sidebar").classList.remove("open");

    if (pageName === "dashboard") renderDashboard();
    if (pageName === "materi") renderCourses();
    if (pageName === "catatan") renderNotes();
    if (pageName === "kalender") renderEvents();
    if (pageName === "progres") renderProgress();
    if (pageName === "profil") updateUserInterface();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

$$("[data-page]").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        showPage(button.dataset.page);
    });
});

$("#menuToggle").addEventListener("click", () => {
    $("#sidebar").classList.toggle("open");
});

document.addEventListener("click", (event) => {
    const sidebar = $("#sidebar");

    if (
        window.innerWidth <= 850 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !$("#menuToggle").contains(event.target)
    ) {
        sidebar.classList.remove("open");
    }
});


/* =========================================================
   MATERI DAN PEMBACA MATERI MEDISTUDY
   ========================================================= */

function getCompletedLessons(course) {
    return courseProgress[course.id] || [];
}

function getCoursePercent(course) {
    const completed = getCompletedLessons(course).length;

    return course.lessons.length
        ? Math.round((completed / course.lessons.length) * 100)
        : 0;
}

function getTotalCompleted() {
    return courses.reduce((total, course) => {
        return total + getCompletedLessons(course).length;
    }, 0);
}

function getTotalLessons() {
    return courses.reduce((total, course) => {
        return total + course.lessons.length;
    }, 0);
}

function renderCourseCard(course) {
    const percent = getCoursePercent(course);

    return `
        <article class="course-card">
            <div class="course-card-art"
                 style="--art-bg:${course.color};--art-color:${course.accent}">
                ${escapeHTML(course.icon)}
            </div>

            <div class="course-card-body">
                <span class="pill">${escapeHTML(course.category)}</span>
                <h3>${escapeHTML(course.title)}</h3>
                <p>${escapeHTML(course.description)}</p>

                <div class="mini-progress">
                    <span style="width:${percent}%"></span>
                </div>

                <p>${percent}% selesai · ${course.lessons.length} submateri · ${escapeHTML(course.duration)}</p>

                <button class="btn btn-primary"
                        data-open-course="${escapeHTML(course.id)}">
                    ${percent === 100 ? "Pelajari kembali" : "Buka materi"} →
                </button>
            </div>
        </article>
    `;
}

function renderCourses() {
    const searchInput = $("#courseSearch");
    const categoryFilter = $("#categoryFilter");
    const courseGrid = $("#courseGrid");
    const courseEmpty = $("#courseEmpty");

    if (!searchInput || !categoryFilter || !courseGrid || !courseEmpty) {
        return;
    }

    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;

    const filtered = courses.filter((course) => {
        const matchesSearch = [
            course.title,
            course.category,
            course.description
        ].some((value) => value.toLowerCase().includes(search));

        const matchesCategory =
            category === "Semua" || course.category === category;

        return matchesSearch && matchesCategory;
    });

    courseGrid.innerHTML = filtered.map(renderCourseCard).join("");
    courseEmpty.classList.toggle("hidden", filtered.length > 0);
}

$("#courseSearch")?.addEventListener("input", renderCourses);
$("#categoryFilter")?.addEventListener("change", renderCourses);

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-course]");

    if (button) {
        openCourse(button.dataset.openCourse, 0);
    }
});

/* =========================================================
   VARIABEL NAVIGASI
   ========================================================= */

let activeLessonIndex = 0;

/* =========================================================
   RENDER NAVIGASI SUBBAB
   ========================================================= */

function renderLessonNavigation(course, lessonIndex) {
    const chapterList = document.getElementById("lessonChapterList");
    const previousButton = document.getElementById("previousLesson");
    const nextButton = document.getElementById("nextLesson");

    if (chapterList) {
        chapterList.replaceChildren();

        course.lessons.forEach((lesson, index) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "lesson-chapter-button";
            button.textContent = `${index + 1}. ${lesson.title}`;

            if (index === lessonIndex) {
                button.classList.add("active");
                button.setAttribute("aria-current", "step");
            }

            button.addEventListener("click", () => {
                openCourse(course.id, index);
            });

            chapterList.appendChild(button);
        });
    }

    if (previousButton) {
        previousButton.disabled = lessonIndex <= 0;
    }

    if (nextButton) {
        nextButton.disabled = lessonIndex >= course.lessons.length - 1;
    }
}

/* =========================================================
   TAMPILKAN DETAIL AKADEMIK
   ========================================================= */

function renderAcademicContent(course, lessonIndex, lesson) {
    const academic = typeof academicDetails !== "undefined"
        ? academicDetails[course.id]
        : null;

    const detail = academic?.lessons?.[lessonIndex];
    const paragraphs = detail?.content || lesson.content || [];

    let html = paragraphs.map((paragraph) => `
        <p>${escapeHTML(paragraph)}</p>
    `).join("");

    if (academic?.objectives?.length) {
        html += `
            <section class="academic-section">
                <h3>🎯 Tujuan Pembelajaran</h3>
                <ul>
                    ${academic.objectives.map((objective) => `
                        <li>${escapeHTML(objective)}</li>
                    `).join("")}
                </ul>
            </section>
        `;
    }

    if (academic?.visual?.steps?.length) {
        html += `
            <section class="academic-section academic-visual">
                <h3>📊 ${escapeHTML(academic.visual.title)}</h3>

                <div class="academic-flow">
                    ${academic.visual.steps.map((step, index) => `
                        ${index > 0
                            ? '<span class="academic-arrow" aria-hidden="true">→</span>'
                            : ""}
                        <div class="academic-flow-item">
                            ${escapeHTML(step)}
                        </div>
                    `).join("")}
                </div>

                <p class="muted">
                    ${escapeHTML(academic.visual.caption || "")}
                </p>
            </section>
        `;
    }

    if (academic?.terms?.length) {
        html += `
            <section class="academic-section">
                <h3>📖 Istilah Penting</h3>

                <dl class="academic-terms">
                    ${academic.terms.map((item) => `
                        <dt><strong>${escapeHTML(item.term)}</strong></dt>
                        <dd>${escapeHTML(item.definition)}</dd>
                    `).join("")}
                </dl>
            </section>
        `;
    }

    if (detail?.takeaway) {
        html += `
            <section class="academic-takeaway">
                <h3>💡 Inti Pembelajaran</h3>
                <p>${escapeHTML(detail.takeaway)}</p>
            </section>
        `;
    }

    if (academic?.references?.length) {
        html += `
            <section class="academic-section academic-references">
                <h3>🔎 Referensi Belajar</h3>
                <ul>
                    ${academic.references.map((reference) => {
                        const safeURL = /^https:\/\/[a-z0-9.-]+(?:\/[^\s"'<>]*)?$/i
                            .test(reference.url)
                            ? reference.url
                            : "";

                        return safeURL
                            ? `<li><a href="${escapeHTML(safeURL)}" target="_blank" rel="noopener noreferrer">${escapeHTML(reference.title)}</a></li>`
                            : `<li>${escapeHTML(reference.title)}</li>`;
                    }).join("")}
                </ul>
            </section>
        `;
    }

    return html;
}

/* =========================================================
   BUKA MATERI
   ========================================================= */

function openCourse(courseId, lessonIndex = 0) {
    const course = courses.find((item) => item.id === courseId);

    if (!course || !course.lessons.length) {
        return;
    }

    if (
        !Number.isInteger(lessonIndex) ||
        lessonIndex < 0 ||
        lessonIndex >= course.lessons.length
    ) {
        return;
    }

    activeCourse = course;
    activeLessonIndex = lessonIndex;

    const lesson = course.lessons[lessonIndex];

    $("#lessonCategory").textContent = course.category;
    $("#lessonTitle").textContent = lesson.title;
    $("#lessonDescription").textContent = course.description;

    $("#lessonContent").innerHTML = renderAcademicContent(
        course,
        lessonIndex,
        lesson
    );

    const isCompleted = getCompletedLessons(course).includes(lessonIndex);

    $("#lessonStatus").textContent = isCompleted
        ? `Submateri ${lessonIndex + 1} dari ${course.lessons.length} telah diselesaikan`
        : `Submateri ${lessonIndex + 1} dari ${course.lessons.length}`;

    $("#completeLesson").textContent = isCompleted
        ? "Sudah selesai ✓"
        : "Tandai selesai ✓";

    $("#completeLesson").disabled = isCompleted;
    $("#completeLesson").style.opacity = isCompleted ? "0.65" : "1";

    renderLessonNavigation(course, lessonIndex);

    $("#lessonModal").classList.remove("hidden");
}

/* =========================================================
   TUTUP MODAL
   ========================================================= */

function closeLessonModal() {
    $("#lessonModal").classList.add("hidden");
}

$("#closeLesson")?.addEventListener("click", closeLessonModal);

$("#lessonModal")?.addEventListener("click", (event) => {
    if (event.target === $("#lessonModal")) {
        closeLessonModal();
    }
});

/* =========================================================
   NAVIGASI SEBELUMNYA / BERIKUTNYA
   ========================================================= */

$("#previousLesson")?.addEventListener("click", () => {
    if (!activeCourse || activeLessonIndex <= 0) {
        return;
    }

    openCourse(activeCourse.id, activeLessonIndex - 1);
});

$("#nextLesson")?.addEventListener("click", () => {
    if (
        !activeCourse ||
        activeLessonIndex >= activeCourse.lessons.length - 1
    ) {
        return;
    }

    openCourse(activeCourse.id, activeLessonIndex + 1);
});

/* =========================================================
   TANDAI MATERI SELESAI
   ========================================================= */

$("#completeLesson")?.addEventListener("click", () => {
    if (!activeCourse) {
        return;
    }

    const lessonIndex = activeLessonIndex;
    const completed = getCompletedLessons(activeCourse);

    if (
        lessonIndex < 0 ||
        lessonIndex >= activeCourse.lessons.length ||
        completed.includes(lessonIndex)
    ) {
        return;
    }

    const previousProgress = courseProgress;

    const updated = [...completed, lessonIndex];

    courseProgress = {
        ...courseProgress,
        [activeCourse.id]: updated
    };

    if (!writeStorage(STORAGE.progress, courseProgress)) {
        courseProgress = previousProgress;
        return;
    }

    renderDashboard();
    renderCourses();
    renderProgress();

    if (updated.length < activeCourse.lessons.length) {
        openCourse(activeCourse.id, lessonIndex + 1);
    } else {
        closeLessonModal();

        if (typeof showToast === "function") {
            showToast("Hebat! Semua submateri pada topik ini selesai.");
        }
    }
});

/* =========================================================
   DASHBOARD DAN STATISTIK
   ========================================================= */


function renderDashboard() {
    // Statistik dashboard
    const completedCourses = courses.filter(
        (course) => getCoursePercent(course) === 100
    ).length;

    const totalLessons = getTotalLessons();
    const completedLessons = getTotalCompleted();

    const totalPercent = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

        const dashboardProgressText = $("#dashboardProgressText");
        const dashboardProgressBar = $("#dashboardProgressBar");
        const dashboardProgressCaption = $("#dashboardProgressCaption");

        if (dashboardProgressText) {
            dashboardProgressText.textContent = `${totalPercent}%`;
        }

        if (dashboardProgressBar) {
            dashboardProgressBar.style.width = `${totalPercent}%`;
        }

        if (dashboardProgressCaption) {
            dashboardProgressCaption.textContent =
                `${completedLessons} dari ${totalLessons} submateri selesai`;
        }

    const statCompleted = $("#statCompleted");
    const statQuizzes = $("#statQuizzes");
    const statNotes = $("#statNotes");
    const statProgress = $("#statProgress");

    if (statCompleted) {
        statCompleted.textContent = completedCourses;
    }

    if (statQuizzes) {
        statQuizzes.textContent = quizAttempts;
    }

    if (statNotes) {
        statNotes.textContent = notes.length;
    }

    if (statProgress) {
        statProgress.textContent = `${totalPercent}%`;
    }

    // Nama pengguna pada sambutan dashboard
    const welcomeName = $("#welcomeName");

    if (welcomeName) {
        welcomeName.textContent = user?.name || "Pengguna";
    }

    // Rekomendasi materi yang belum selesai
    const dashboardCourses = $("#dashboardCourses");

    if (!dashboardCourses) return;

    const incompleteCourses = courses.filter(
        (course) => getCoursePercent(course) < 100
    );

    // Jika semua materi selesai, tampilkan semuanya sebagai materi ulasan.
    const recommendedCourses = (
        incompleteCourses.length > 0
            ? incompleteCourses
            : courses
    ).slice(0, 3);

    dashboardCourses.innerHTML = recommendedCourses.map((course) => {
        const percent = getCoursePercent(course);
        const isCompleted = percent === 100;

        return `
            <article class="course-row">
                <div
                    class="course-art"
                    style="
                        --art-bg:${course.color};
                        --art-color:${course.accent}
                    "
                >
                    ${course.icon}
                </div>

                <div class="course-row-main">
                    <h4>${escapeHTML(course.title)}</h4>

                    <p>
                        ${escapeHTML(course.category)}
                        · ${percent}% selesai
                    </p>

                    <div
                        class="mini-progress"
                        role="progressbar"
                        aria-label="Progres ${escapeHTML(course.title)}"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="${percent}"
                    >
                        <span style="width:${percent}%"></span>
                    </div>
                </div>

                <button
                    type="button"
                    class="course-open"
                    data-open-course="${course.id}"
                    aria-label="${
                        isCompleted
                            ? "Ulangi "
                            : "Lanjutkan "
                    }${escapeHTML(course.title)}"
                    title="${
                        isCompleted
                            ? "Pelajari kembali"
                            : "Buka materi"
                    }"
                >
                    →
                </button>
            </article>
        `;
    }).join("");
}

/* =========================================================
   CATATAN
   ========================================================= */

$("#noteForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#noteTitle").value.trim();
    const content = $("#noteContent").value.trim();

    if (!title || !content) {
        showToast("Lengkapi judul dan isi catatan.");
        return;
    }

    const previous = notes;

    notes = [
        {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
            title,
            content,
            createdAt: new Date().toISOString()
        },
        ...notes
    ];

    if (!writeStorage(STORAGE.notes, notes)) {
        notes = previous;
        return;
    }

    $("#noteForm").reset();
    renderNotes();
    renderDashboard();
    showToast("Catatan berhasil disimpan.");
});

function renderNotes() {
    $("#notesGrid").innerHTML = notes.map((note) => `
        <article class="note-card">
            <h3>${escapeHTML(note.title)}</h3>
            <p>${escapeHTML(note.content)}</p>
            <footer>
                <span>${new Date(note.createdAt).toLocaleDateString("id-ID")}</span>
                <button class="danger-button" data-delete-note="${escapeHTML(note.id)}">
                    Hapus
                </button>
            </footer>
        </article>
    `).join("");

    $("#notesEmpty").classList.toggle("hidden", notes.length > 0);
}

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-note]");

    if (!button) return;

    const noteId = button.dataset.deleteNote;
    const previous = notes;

    notes = notes.filter((note) => note.id !== noteId);

    if (!writeStorage(STORAGE.notes, notes)) {
        notes = previous;
        return;
    }

    renderNotes();
    renderDashboard();
    showToast("Catatan dihapus.");
});

/* =========================================================
   KALENDER BELAJAR
   ========================================================= */

$("#eventDate").min = todayISO();
$("#eventDate").value = todayISO();

$("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const title = $("#eventTitle").value.trim();
    const date = $("#eventDate").value;

    if (!title || !date) {
        showToast("Isi agenda dan tanggal terlebih dahulu.");
        return;
    }

    const previous = events;

    events = [
        ...events,
        {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
            title,
            date
        }
    ].sort((a, b) => a.date.localeCompare(b.date));

    if (!writeStorage(STORAGE.events, events)) {
        events = previous;
        return;
    }

    $("#eventTitle").value = "";
    $("#eventDate").value = todayISO();

    renderEvents();
    showToast("Agenda berhasil ditambahkan.");
});

function renderEvents() {
    const sortedEvents = [...events].sort((a, b) => {
        return a.date.localeCompare(b.date);
    });

    $("#eventsList").innerHTML = sortedEvents.map((item) => {
        const date = new Date(`${item.date}T00:00:00`);

        return `
            <article class="event-item">
                <div class="event-date">
                    <strong>${date.getDate()}</strong>
                    <small>${date.toLocaleDateString("id-ID", { month: "short" })}</small>
                </div>
                <div class="event-details">
                    <h4>${escapeHTML(item.title)}</h4>
                    <p>${formatDate(item.date)}</p>
                </div>
                <button class="danger-button"
                        data-delete-event="${escapeHTML(item.id)}">
                    Hapus
                </button>
            </article>
        `;
    }).join("");

    $("#eventsEmpty").classList.toggle("hidden", sortedEvents.length > 0);
}

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-event]");

    if (!button) return;

    const eventId = button.dataset.deleteEvent;
    const previous = events;

    events = events.filter((item) => item.id !== eventId);

    if (!writeStorage(STORAGE.events, events)) {
        events = previous;
        return;
    }

    renderEvents();
    showToast("Agenda berhasil dihapus.");
});

/* =========================================================
   LATIHAN SOAL
   ========================================================= */

function renderQuiz() {
    const question = questions[quizIndex];

    if (!question) return;

    selectedAnswer = null;
    answered = false;

    $("#quizCounter").textContent =
        `Soal ${quizIndex + 1} dari ${questions.length}`;

    $("#quizProgress").style.width =
        `${(quizIndex / questions.length) * 100}%`;

    $("#quizQuestion").textContent = question.question;

    $("#quizOptions").innerHTML = question.options.map((option, index) => `
        <button class="quiz-option" data-answer="${index}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span>${escapeHTML(option)}</span>
        </button>
    `).join("");

    $("#quizFeedback").textContent = "";
    $("#quizFeedback").className = "quiz-feedback";
    $("#quizScore").textContent = `Skor: ${quizScore}`;
    $("#quizNext").disabled = true;
    $("#quizNext").textContent =
        quizIndex === questions.length - 1 ? "Lihat hasil →" : "Berikutnya →";
}

$("#quizOptions").addEventListener("click", (event) => {
    const button = event.target.closest("[data-answer]");

    if (!button || answered) return;

    answered = true;
    selectedAnswer = Number(button.dataset.answer);

    const question = questions[quizIndex];
    const isCorrect = selectedAnswer === question.answer;

    if (isCorrect) quizScore++;

    $$("#quizOptions .quiz-option").forEach((option) => {
        option.disabled = true;

        const answerIndex = Number(option.dataset.answer);

        if (answerIndex === question.answer) {
            option.classList.add("correct");
        } else if (answerIndex === selectedAnswer) {
            option.classList.add("wrong");
        }
    });

    $("#quizFeedback").textContent = isCorrect
        ? `Benar! ${question.explanation}`
        : `Belum tepat. ${question.explanation}`;

    $("#quizFeedback").classList.add(
        isCorrect ? "correct-text" : "wrong-text"
    );

    $("#quizScore").textContent = `Skor: ${quizScore}`;
    $("#quizNext").disabled = false;
});

$("#quizNext").addEventListener("click", () => {
    if (!answered) return;

    if (quizIndex < questions.length - 1) {
        quizIndex++;
        renderQuiz();
        return;
    }

    quizAttempts++;
    writeStorage(STORAGE.quiz, quizAttempts);

    const percent = Math.round((quizScore / questions.length) * 100);

    $("#quizPanel").innerHTML = `
        <div class="stat-icon green">✓</div>
        <p class="eyebrow" style="margin-top:18px">HASIL LATIHAN</p>
        <h2>Kamu mendapat ${quizScore} dari ${questions.length} jawaban benar.</h2>
        <p class="muted">Nilai kamu: ${percent}%. Terus berlatih untuk memperkuat pemahamanmu.</p>
        <button class="btn btn-primary" id="quizPlayAgain">Ulangi latihan ↻</button>
    `;

    $("#quizPlayAgain").addEventListener("click", restartQuiz);
    renderDashboard();
});

function restartQuiz() {
    quizIndex = 0;
    quizScore = 0;
    selectedAnswer = null;
    answered = false;

    $("#quizPanel").innerHTML = `
        <div class="quiz-meta">
            <span class="pill">Pengetahuan umum</span>
            <span id="quizCounter"></span>
        </div>
        <div class="progress-track">
            <div class="progress-fill" id="quizProgress"></div>
        </div>
        <h2 id="quizQuestion"></h2>
        <div class="quiz-options" id="quizOptions"></div>
        <p id="quizFeedback" class="quiz-feedback" aria-live="polite"></p>
        <div class="quiz-footer">
            <span class="muted small" id="quizScore"></span>
            <button class="btn btn-primary" id="quizNext" disabled></button>
        </div>
    `;

    renderQuiz();
}

$("#restartQuiz").addEventListener("click", restartQuiz);

/* =========================================================
   PROGRES BELAJAR
   ========================================================= */

function renderProgress() {
    const total = getTotalLessons();
    const completed = getTotalCompleted();
    const percent = total ? Math.round((completed / total) * 100) : 0;

    $("#progressHeadline").textContent = `${percent}%`;
    $("#progressRingText").textContent = `${percent}%`;
    $("#progressRing").style.background =
        `conic-gradient(var(--primary) ${percent * 3.6}deg, #eeeefa 0deg)`;

    $("#progressDescription").textContent =
        `${completed} dari ${total} submateri telah diselesaikan.`;

    $("#progressList").innerHTML = courses.map((course) => {
        const coursePercent = getCoursePercent(course);
        const completedCount = getCompletedLessons(course).length;

        return `
            <div class="progress-item">
                <div class="progress-item-head">
                    <span>${escapeHTML(course.title)}</span>
                    <span>${coursePercent}%</span>
                </div>
                <div class="mini-progress">
                    <span style="width:${coursePercent}%"></span>
                </div>
                <p class="small muted">
                    ${completedCount} dari ${course.lessons.length} submateri selesai
                </p>
            </div>
        `;
    }).join("");
}

/* =====================================================
   EDITOR FOTO PROFIL MEDISTUDY
   Fitur: Upload, Crop Lingkaran, Drag, Zoom, Simpan
===================================================== */

const cropState = {
    image: null,
    objectUrl: null,
    baseWidth: 0,
    baseHeight: 0,
    x: 0,
    y: 0,
    zoom: 1,
    pointerX: 0,
    pointerY: 0,
    dragging: false,
    pointerId: null
};

const cropModal = document.querySelector("#cropModal");
const cropStage = document.querySelector("#cropStage");
const cropImage = document.querySelector("#cropImage");
const cropZoom = document.querySelector("#cropZoom");
const photoInput = document.querySelector("#photoInput");
const saveCropButton = document.querySelector("#saveCrop");
const cancelCropButton = document.querySelector("#cancelCrop");
const closeCropButton = document.querySelector("#closeCrop");

/* Pastikan elemen HTML tersedia */
if (
    cropModal &&
    cropStage &&
    cropImage &&
    cropZoom &&
    photoInput
) {
    /* Buka pemilih foto */
    document.querySelectorAll(
        "#changePhotoButton, #changePhotoButtonAlt"
    ).forEach((button) => {
        button.addEventListener("click", () => {
            photoInput.click();
        });
    });

    /* Unggah foto */
    photoInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        photoInput.value = "";

        if (!file) return;

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            showToast("Pilih foto JPG, PNG, atau WebP.");
            return;
        }

        if (file.size > 12 * 1024 * 1024) {
            showToast("Ukuran foto maksimal 12 MB.");
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            cropState.image = image;
            cropState.objectUrl = objectUrl;
            cropState.x = 0;
            cropState.y = 0;
            cropState.zoom = 1;

            cropImage.onload = () => {
                cropModal.classList.remove("hidden");

                requestAnimationFrame(() => {
                    const stageSize = cropStage.clientWidth;

                    if (!stageSize) {
                        console.error(
                            "Crop stage tidak memiliki ukuran."
                        );
                        showToast(
                            "Editor foto tidak terlihat. Periksa CSS."
                        );
                        return;
                    }

                    const scale = Math.max(
                        stageSize / image.naturalWidth,
                        stageSize / image.naturalHeight
                    );

                    cropState.baseWidth =
                        image.naturalWidth * scale;

                    cropState.baseHeight =
                        image.naturalHeight * scale;

                    cropImage.style.width =
                        `${cropState.baseWidth}px`;

                    cropImage.style.height =
                        `${cropState.baseHeight}px`;

                    cropZoom.value = "1";

                    updateCropImage();
                });
            };

            cropImage.onerror = () => {
                showToast("Foto gagal ditampilkan.");
                closeCropEditor();
            };

            cropImage.src = objectUrl;
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            showToast("Foto tidak dapat dibuka.");
        };

        image.src = objectUrl;
    });

    /* Batasi pergeseran agar area crop selalu tertutup foto */
    function clampCropPosition() {
        const stageSize = cropStage.clientWidth;

        const displayedWidth =
            cropState.baseWidth * cropState.zoom;

        const displayedHeight =
            cropState.baseHeight * cropState.zoom;

        const maxX = Math.max(
            0,
            (displayedWidth - stageSize) / 2
        );

        const maxY = Math.max(
            0,
            (displayedHeight - stageSize) / 2
        );

        cropState.x = Math.max(
            -maxX,
            Math.min(maxX, cropState.x)
        );

        cropState.y = Math.max(
            -maxY,
            Math.min(maxY, cropState.y)
        );
    }

    /* Tampilkan posisi foto */
    function updateCropImage() {
        if (!cropState.image) return;

        clampCropPosition();

        cropImage.style.transform = `
            translate(
                calc(-50% + ${cropState.x}px),
                calc(-50% + ${cropState.y}px)
            )
            scale(${cropState.zoom})
        `;
    }

    /* Zoom */
    cropZoom.addEventListener("input", () => {
        cropState.zoom = Number(cropZoom.value);
        updateCropImage();
    });

    /* Mulai menggeser foto */
    cropStage.addEventListener("pointerdown", (event) => {
        if (!cropState.image) return;

        cropState.dragging = true;
        cropState.pointerId = event.pointerId;
        cropState.pointerX = event.clientX;
        cropState.pointerY = event.clientY;

        cropStage.classList.add("dragging");
        cropStage.setPointerCapture(event.pointerId);
    });

    /* Geser foto */
    cropStage.addEventListener("pointermove", (event) => {
        if (
            !cropState.dragging ||
            event.pointerId !== cropState.pointerId
        ) {
            return;
        }

        cropState.x += event.clientX - cropState.pointerX;
        cropState.y += event.clientY - cropState.pointerY;

        cropState.pointerX = event.clientX;
        cropState.pointerY = event.clientY;

        updateCropImage();
    });

    /* Selesaikan drag */
    function stopCropDragging(event) {
        if (
            event &&
            cropState.pointerId !== event.pointerId
        ) {
            return;
        }

        cropState.dragging = false;
        cropState.pointerId = null;

        cropStage.classList.remove("dragging");
    }

    cropStage.addEventListener("pointerup", stopCropDragging);
    cropStage.addEventListener("pointercancel", stopCropDragging);

    cropStage.addEventListener("lostpointercapture", () => {
        cropState.dragging = false;
        cropState.pointerId = null;
        cropStage.classList.remove("dragging");
    });

    /* Tutup editor */
    function closeCropEditor() {
        cropModal.classList.add("hidden");

        cropImage.onload = null;
        cropImage.onerror = null;
        cropImage.removeAttribute("src");

        if (cropState.objectUrl) {
            URL.revokeObjectURL(cropState.objectUrl);
        }

        cropState.image = null;
        cropState.objectUrl = null;
        cropState.dragging = false;
        cropState.pointerId = null;
        cropState.x = 0;
        cropState.y = 0;
        cropState.zoom = 1;
    }

    cancelCropButton?.addEventListener(
        "click",
        closeCropEditor
    );

    closeCropButton?.addEventListener(
        "click",
        closeCropEditor
    );

    cropModal.addEventListener("click", (event) => {
        if (event.target === cropModal) {
            closeCropEditor();
        }
    });

    /* Simpan foto hasil crop */
    saveCropButton?.addEventListener("click", () => {
        const image = cropState.image;

        if (!image) {
            showToast("Pilih foto terlebih dahulu.");
            return;
        }

        const stageSize = cropStage.clientWidth;

        if (!stageSize) {
            showToast("Editor foto belum siap.");
            return;
        }

        const scale =
            cropState.baseWidth *
            cropState.zoom /
            image.naturalWidth;

        const sourceSize = stageSize / scale;

        const sourceX = (
        cropState.baseWidth * cropState.zoom / 2 -
        stageSize / 2 -
        cropState.x
        ) / scale;

        const sourceY = (
        cropState.baseHeight * cropState.zoom / 2 -
        stageSize / 2 -
        cropState.y
        ) / scale;

        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;

        const context = canvas.getContext("2d");

        if (!context) {
            showToast("Browser tidak mendukung pengolahan foto.");
            return;
        }

        /* Hasil foto berbentuk lingkaran */
        context.save();
        context.beginPath();
        context.arc(256, 256, 256, 0, Math.PI * 2);
        context.clip();

        context.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            512,
            512
        );

        context.restore();

        let newPhoto;

        try {
            newPhoto = canvas.toDataURL("image/png");

            localStorage.setItem(STORAGE.photo, newPhoto);
        } catch (error) {
            console.error("Gagal menyimpan foto:", error);
            showToast(
                "Foto gagal disimpan. Penyimpanan browser mungkin penuh."
            );
            return;
        }

        savedPhoto = newPhoto;
        updateUserInterface();
        closeCropEditor();

        showToast("Foto profil berhasil disimpan.");
    });
} else {
    console.error(
        "Editor foto MediStudy: elemen HTML tidak lengkap.",
        {
            cropModal,
            cropStage,
            cropImage,
            cropZoom,
            photoInput
        }
    );
}

/* =========================================================
   INISIALISASI
   ========================================================= */

function initializeApp() {
    $("#todayLabel").textContent = new Date().toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

    $("#yearLabel").textContent = new Date().getFullYear();

    renderDashboard();
    renderCourses();
    renderNotes();
    renderEvents();
    renderProgress();
    renderQuiz();

    if (user?.name) {
        showApplication();
    } else {
        $("#loginScreen").classList.remove("hidden");
        $("#appShell").classList.add("hidden");
    }
}

initializeApp();

/* ==========================
   MODE GELAP MEDISTUDY
========================== */

(() => {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) {
        console.error("Tombol mode gelap tidak ditemukan.");
        return;
    }

    function applyTheme(theme) {
        const isDark = theme === "dark";

        document.documentElement.setAttribute("data-theme", theme);

        const icon = document.getElementById("themeIcon");
        const label = document.getElementById("themeLabel");

        if (icon) {
            icon.textContent = isDark ? "☀️" : "🌙";
        }

        if (label) {
            label.textContent = isDark ? "Mode Terang" : "Mode Gelap";
        }

        themeToggle.setAttribute(
            "aria-label",
            isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"
        );

        try {
            localStorage.setItem("ms_theme", theme);
        } catch (error) {
            console.error("Tema gagal disimpan:", error);
        }
    }

    // Gunakan tema tersimpan saat halaman dibuka.
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem("ms_theme") || "light";
    } catch (error) {
        console.error("Tema gagal dibaca:", error);
    }

    applyTheme(savedTheme);

    // Mencegah listener tombol dipasang lebih dari sekali.
    if (themeToggle.dataset.themeListener !== "active") {
        themeToggle.dataset.themeListener = "active";

        themeToggle.addEventListener("click", () => {
            const currentTheme =
                document.documentElement.getAttribute("data-theme") || "light";

            applyTheme(currentTheme === "dark" ? "light" : "dark");
        });
    }
})();

