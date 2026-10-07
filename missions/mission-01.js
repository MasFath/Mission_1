/* MISSION 01 — Kenali Mesinmu. Kunci jawaban = indeks opsi (0=A, 1=B, 2=C, 3=D). */
const mission01 = {
  id: "mission-01",
  title: "Kenali Mesinmu",
  level: "Computer Rookie",
  description: "Kenali bagian-bagian komputer dan pahami bagaimana hardware dan software bekerja bersama.",
  task: "Kenali hardware dan software serta pahami bagaimana keduanya bekerja bersama.",
  timeLimit: 900,
  passingScore: 80,
  questions: [
    { text: "Perangkat komputer yang dapat dilihat dan disentuh disebut...", options: ["Software", "Hardware", "Internet", "Data"], answer: 1 },
    { text: "Manakah yang termasuk hardware?", options: ["Windows", "Google Chrome", "RAM", "Microsoft Word"], answer: 2 },
    { text: "Manakah yang termasuk software?", options: ["Keyboard", "Monitor", "RAM", "Windows"], answer: 3 },
    { text: "Komponen yang berfungsi sebagai tempat pemrosesan utama komputer adalah...", options: ["Processor", "Keyboard", "Monitor", "Speaker"], answer: 0 },
    { text: "RAM digunakan komputer terutama untuk...", options: ["Menyimpan data sementara saat program berjalan", "Menampilkan gambar ke monitor", "Mencetak dokumen", "Mengeluarkan suara"], answer: 0 },
    { text: "Yang termasuk sistem operasi adalah...", options: ["Windows", "Google Chrome", "Paint", "Keyboard"], answer: 0 },
    { text: "Google Chrome termasuk...", options: ["Processor", "Sistem operasi", "Aplikasi", "RAM"], answer: 2 },
    { text: "Komputer memiliki keyboard, monitor, processor, RAM, dan Windows. Agar komputer dapat digunakan untuk mengetik dokumen, diperlukan...", options: ["Hardware saja", "Software saja", "Hardware dan software", "Internet saja"], answer: 2 },
    { text: "Manakah pasangan yang benar?", options: ["Keyboard — Software", "Windows — Hardware", "RAM — Hardware", "Chrome — Hardware"], answer: 2 },
    { text: "Ketika komputer digunakan, hardware dan software bekerja bersama. Pernyataan yang paling tepat adalah...", options: ["Hardware dapat bekerja tanpa software", "Software tidak membutuhkan hardware", "Hardware dan software saling mendukung agar komputer dapat digunakan", "Software adalah bagian dari casing"], answer: 2 }
  ]
};
