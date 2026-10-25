/* Bộ câu hỏi mẫu (chép từ các bài HTML cũ). Mỗi bộ: {title, raw:[...]} — raw giữ nguyên định dạng bài gốc */
window.SAMPLE_SETS = [
{ title: 'English 7 · Cuối kỳ II · Test 1 p1', raw: [
  {
    id:1,
    sec:"Pronunciation – Underlined part differs",
    q:"Mark the word whose underlined part differs from the other three in pronunciation.",
    opts:[
      {h:"y<u>ea</u>r",c:false},
      {h:"w<u>ea</u>r",c:true},
      {h:"app<u>ea</u>r",c:false},
      {h:"h<u>ea</u>r",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: w<u>ea</u>r</strong><br><br>
<strong>Phân tích phát âm của "ea" trong từng đáp án:</strong><br>
• <strong>y<u>ea</u>r /jɪər/</strong>: "ea" phát âm là <em>/ɪə/</em><br>
• <strong class='ok'>w<u>ea</u>r /weər/</strong>: "ea" phát âm là <strong>/eə/</strong> ← KHÁC với các từ còn lại<br>
• <strong>app<u>ea</u>r /əˈpɪər/</strong>: "ea" phát âm là <em>/ɪə/</em><br>
• <strong>h<u>ea</u>r /hɪər/</strong>: "ea" phát âm là <em>/ɪə/</em><br><br>
<strong>🔑 Mẹo nhớ:</strong> Ba từ <em>year, appear, hear</em> đều phát âm "ea" là <strong>/ɪə/</strong> (nghe như "ia"). Riêng <strong>wear</strong> phát âm "ea" là <strong>/eə/</strong> (nghe như "e"), giống với <em>bear, pear, swear, where</em>.`
  },
  {
    id:2,
    sec:"Pronunciation – Underlined part differs",
    q:"Mark the word whose underlined part differs from the other three in pronunciation.",
    opts:[
      {h:"paint<u>ed</u>",c:true},
      {h:"park<u>ed</u>",c:false},
      {h:"watch<u>ed</u>",c:false},
      {h:"stopp<u>ed</u>",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: paint<u>ed</u></strong><br><br>
<strong>Quy tắc phát âm đuôi "-ed":</strong><br>
&nbsp;&nbsp;→ <strong>/ɪd/</strong>: sau âm /t/ hoặc /d/ (want<strong>ed</strong>, need<strong>ed</strong>)<br>
&nbsp;&nbsp;→ <strong>/t/</strong>: sau âm vô thanh khác (p, k, f, s, sh, ch, ...)<br>
&nbsp;&nbsp;→ <strong>/d/</strong>: sau âm hữu thanh còn lại<br><br>
<strong>Phân tích từng từ:</strong><br>
• <strong class='ok'>paint<u>ed</u> /ˈpeɪntɪd/</strong>: "paint" kết thúc /t/ → "ed" phát âm <strong>/ɪd/</strong> ← KHÁC<br>
• <strong>park<u>ed</u> /pɑːrkt/</strong>: "park" kết thúc /k/ (vô thanh) → "ed" phát âm <strong>/t/</strong><br>
• <strong>watch<u>ed</u> /wɒtʃt/</strong>: "watch" kết thúc /tʃ/ (vô thanh) → "ed" phát âm <strong>/t/</strong><br>
• <strong>stopp<u>ed</u> /stɒpt/</strong>: "stop" kết thúc /p/ (vô thanh) → "ed" phát âm <strong>/t/</strong>`
  },
  {
    id:3,
    sec:"Word Stress – Primary stress position differs",
    q:"Mark the word that differs from the other three in the position of primary stress.",
    opts:[
      {h:"turkey",c:false},
      {h:"boring",c:false},
      {h:"joyful",c:false},
      {h:"donate",c:true}
    ],
    exp:`<strong>📌 Đáp án đúng: donate</strong><br><br>
<strong>Phân tích vị trí trọng âm:</strong><br>
• <strong>TUR-key /ˈtɜːrki/</strong>: trọng âm rơi vào âm tiết <strong>1</strong><br>
• <strong>BOR-ing /ˈbɔːrɪŋ/</strong>: trọng âm rơi vào âm tiết <strong>1</strong><br>
• <strong>JOY-ful /ˈdʒɔɪfəl/</strong>: trọng âm rơi vào âm tiết <strong>1</strong><br>
• <strong class='ok'>do-NATE /dəˈneɪt/</strong>: trọng âm rơi vào âm tiết <strong>2</strong> ← KHÁC<br><br>
<strong>🔑 Giải thích:</strong> Các từ <em>turkey, boring, joyful</em> đều nhấn âm tiết đầu. Riêng <strong>donate</strong> là động từ 2 âm tiết thường mang trọng âm ở <strong>âm tiết thứ 2</strong> (tương tự: <em>doNATE, exPLAIN, perFORM</em>).`
  },
  {
    id:4,
    sec:"Word Stress – Primary stress position differs",
    q:"Mark the word that differs from the other three in the position of primary stress.",
    opts:[
      {h:"expensive",c:true},
      {h:"energy",c:false},
      {h:"beautiful",c:false},
      {h:"easily",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: expensive</strong><br><br>
<strong>Phân tích vị trí trọng âm:</strong><br>
• <strong class='ok'>ex-PEN-sive /ɪkˈspensɪv/</strong>: trọng âm âm tiết <strong>2</strong> ← KHÁC<br>
• <strong>EN-er-gy /ˈenərdʒi/</strong>: trọng âm âm tiết <strong>1</strong><br>
• <strong>BEAU-ti-ful /ˈbjuːtɪfəl/</strong>: trọng âm âm tiết <strong>1</strong><br>
• <strong>EAS-i-ly /ˈiːzɪli/</strong>: trọng âm âm tiết <strong>1</strong><br><br>
<strong>🔑 Giải thích:</strong> Ba từ <em>energy, beautiful, easily</em> đều nhấn âm tiết đầu. Riêng <strong>expensive</strong> là tính từ 3 âm tiết với đuôi <em>-ive</em> mang trọng âm ở <strong>âm tiết thứ 2</strong>.`
  },
  {
    id:5,
    sec:"Grammar – Tenses",
    q:"Now we ___ for a cheap, clean and efficient energy source.",
    opts:[
      {h:"look",c:false},
      {h:"are looking",c:true},
      {h:"looks",c:false},
      {h:"is looking",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: are looking</strong><br><br>
<strong>Dịch câu:</strong> "Bây giờ chúng tôi đang tìm kiếm một nguồn năng lượng rẻ, sạch và hiệu quả."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>look</strong>: Hiện tại đơn → không phù hợp với dấu hiệu "Now"<br>
• <strong class='ok'>are looking</strong>: Hiện tại tiếp diễn → ĐÚNG vì có trạng từ <strong>"Now"</strong> và chủ ngữ "we" dùng "are"<br>
• <strong>looks</strong>: Hiện tại đơn ngôi 3 số ít (he/she/it) → sai chủ ngữ<br>
• <strong>is looking</strong>: Hiện tại tiếp diễn nhưng "is" dùng cho he/she/it → sai với "we"<br><br>
<strong>🔑 Dấu hiệu nhận biết Thì HTTD:</strong> <em>now, right now, at the moment, at present, currently, look!, listen!</em><br>
<strong>Công thức:</strong> S (we) + <strong>are</strong> + V-ing`
  },
  {
    id:6,
    sec:"Vocabulary",
    q:"Because vehicles using fossil fuels cause pollution, scientists want to find a cheaper and ____ replacement.",
    opts:[
      {h:"inconvenient",c:false},
      {h:"dangerous",c:false},
      {h:"polluted",c:false},
      {h:"eco-friendly",c:true}
    ],
    exp:`<strong>📌 Đáp án đúng: eco-friendly</strong><br><br>
<strong>Dịch câu:</strong> "Vì các phương tiện dùng nhiên liệu hóa thạch gây ô nhiễm, các nhà khoa học muốn tìm một thứ thay thế rẻ hơn và ____ hơn."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>inconvenient (adj)</strong>: không tiện lợi → các nhà khoa học muốn tìm thứ TỐT hơn, không thể chọn thứ "không tiện lợi hơn"<br>
• <strong>dangerous (adj)</strong>: nguy hiểm → trái ngược mục đích bảo vệ an toàn<br>
• <strong>polluted (adj)</strong>: bị ô nhiễm → các nhà khoa học đang cố TRÁNH ô nhiễm<br>
• <strong class='ok'>eco-friendly (adj)</strong>: thân thiện với môi trường → ĐÚNG, phù hợp với bối cảnh thay thế nhiên liệu gây ô nhiễm<br><br>
<strong>🔑 Từ chìa khóa:</strong> "cause pollution" → cần tìm thứ thay thế "<strong>eco-friendly</strong>" (thân thiện với môi trường).`
  },
  {
    id:7,
    sec:"Grammar – Prepositions",
    q:"How far is it ___ house to school?",
    opts:[
      {h:"from",c:true},
      {h:"with",c:false},
      {h:"at",c:false},
      {h:"on",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: from</strong><br><br>
<strong>Dịch câu:</strong> "Từ nhà đến trường bao xa?"<br><br>
<strong>Cấu trúc quan trọng cần nhớ:</strong><br>
<strong>How far is it FROM ... TO ...?</strong> = Từ ... đến ... bao xa?<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>from</strong>: đúng cấu trúc "from A to B" (từ A đến B)<br>
• <strong>with</strong>: không dùng trong cấu trúc hỏi khoảng cách<br>
• <strong>at</strong>: chỉ vị trí cụ thể (at school = ở trường), không chỉ khoảng cách<br>
• <strong>on</strong>: không dùng trong cấu trúc này<br><br>
<strong>🔑 Ví dụ thêm:</strong> "It is 2km <strong>from</strong> my house <strong>to</strong> school." (Từ nhà tôi đến trường là 2km.)`
  },
  {
    id:8,
    sec:"Grammar – Modal Verbs",
    q:"She's always tired. She ____ go to bed late every night.",
    opts:[
      {h:"wouldn't",c:false},
      {h:"shouldn't",c:true},
      {h:"mightn't",c:false},
      {h:"couldn't",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: shouldn't</strong><br><br>
<strong>Dịch câu:</strong> "Cô ấy luôn mệt mỏi. Cô ấy <strong>không nên</strong> đi ngủ muộn mỗi đêm."<br><br>
<strong>Phân tích 4 modal verbs:</strong><br>
• <strong>wouldn't</strong>: sẽ không (từ chối/điều kiện giả định) → không phải lời khuyên<br>
• <strong class='ok'>shouldn't</strong>: không nên → ĐÚNG, đây là lời khuyên/phê phán hành vi<br>
• <strong>mightn't</strong>: có thể không (khả năng) → không phù hợp ngữ cảnh<br>
• <strong>couldn't</strong>: không thể (giới hạn khả năng) → không phù hợp<br><br>
<strong>🔑 Lý giải logic:</strong> Câu đầu nói cô ấy "always tired" (luôn mệt mỏi), nên câu tiếp theo đưa ra lời khuyên: cô ấy <strong>shouldn't</strong> (không nên) đi ngủ muộn. Đây là cấu trúc <strong>advice</strong> (lời khuyên).`
  },
  {
    id:9,
    sec:"Grammar – Conjunctions",
    q:"_____ it rained, they went to Hoan Kiem Lake to watch the fireworks display.",
    opts:[
      {h:"However",c:false},
      {h:"If",c:false},
      {h:"Although",c:true},
      {h:"As",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: Although</strong><br><br>
<strong>Dịch câu:</strong> "Mặc dù trời mưa, họ vẫn đến Hồ Hoàn Kiếm để xem bắn pháo hoa."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>However</strong>: "tuy nhiên" → là trạng từ, đứng đầu câu độc lập, không nối 2 mệnh đề trong 1 câu<br>
• <strong>If</strong>: "nếu" → diễn đạt điều kiện, không phải nhượng bộ<br>
• <strong class='ok'>Although</strong>: "mặc dù" → ĐÚNG, nối 2 mệnh đề có ý tương phản (trời mưa nhưng vẫn đi)<br>
• <strong>As</strong>: "khi / vì" → không diễn đạt sự nhượng bộ/tương phản<br><br>
<strong>🔑 Cấu trúc:</strong> <strong>Although / Even though / Though</strong> + S + V, S + V<br>
<strong>⚠️ Lưu ý quan trọng:</strong> Không dùng "but" sau "although" trong cùng một câu!`
  },
  {
    id:10,
    sec:"Vocabulary – Word Form",
    q:"Singapore is famous for its ____ and green trees.",
    opts:[
      {h:"cleanliness",c:true},
      {h:"cleanly",c:false},
      {h:"cleaning",c:false},
      {h:"clean",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: cleanliness</strong><br><br>
<strong>Dịch câu:</strong> "Singapore nổi tiếng về <strong>sự sạch sẽ</strong> và cây xanh."<br><br>
<strong>Phân tích từ loại:</strong><br>
Sau "for its" cần một <strong>DANH TỪ</strong> (possessive adjective + noun)<br>
• <strong class='ok'>cleanliness (n)</strong>: sự sạch sẽ → ĐÚNG (danh từ)<br>
• <strong>cleanly (adv)</strong>: một cách sạch sẽ → phó từ, không dùng được sau "its"<br>
• <strong>cleaning (v/n)</strong>: đang làm sạch / việc làm sạch → không phù hợp ngữ cảnh<br>
• <strong>clean (adj/v)</strong>: sạch sẽ / làm sạch → tính từ hoặc động từ, không phù hợp sau "its"<br><br>
<strong>🔑 Họ hàng từ "clean":</strong><br>
clean (adj/v) → <strong>cleanliness</strong> (n) → cleanly (adv) → cleanse (v) → cleaner (n)`
  },
  {
    id:11,
    sec:"Vocabulary",
    q:"New Zealand ____ lovers of nature and fans of dangerous sports.",
    opts:[
      {h:"attracts",c:true},
      {h:"keeps",c:false},
      {h:"calls",c:false},
      {h:"asks",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: attracts</strong><br><br>
<strong>Dịch câu:</strong> "New Zealand <strong>thu hút</strong> những người yêu thiên nhiên và những người hâm mộ thể thao mạo hiểm."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>attracts (v)</strong>: thu hút → ĐÚNG, cụm từ cố định "<strong>attract visitors/tourists/people</strong>"<br>
• <strong>keeps (v)</strong>: giữ lại → không phù hợp (giữ người thì như cưỡng ép, không tự nhiên)<br>
• <strong>calls (v)</strong>: gọi, gọi điện → không phù hợp ngữ cảnh<br>
• <strong>asks (v)</strong>: hỏi, yêu cầu → không phù hợp<br><br>
<strong>🔑 Collocation:</strong> <strong>attract + tourists / visitors / people / attention</strong> (thu hút khách du lịch / du khách / người / sự chú ý)`
  },
  {
    id:12,
    sec:"Dialogue Completion",
    q:`"Recycling will help us protect our environment, won't it?" – "___"`,
    opts:[
      {h:"I couldn't agree with you more.",c:true},
      {h:"I'm afraid not.",c:false},
      {h:"You are welcome.",c:false},
      {h:"Our environment is quite better.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: I couldn't agree with you more.</strong><br><br>
<strong>Dịch đoạn hội thoại:</strong><br>
A: "Tái chế sẽ giúp chúng ta bảo vệ môi trường, phải không?" <br>
B: "___"<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>"I couldn't agree with you more."</strong>: Tôi hoàn toàn đồng ý với bạn → ĐÚNG, đây là câu đồng ý mạnh mẽ nhất trong tiếng Anh<br>
• <strong>"I'm afraid not."</strong>: Tôi e rằng không → phản đối, không phù hợp<br>
• <strong>"You are welcome."</strong>: Không có gì → chỉ dùng để trả lời "Thank you", không phù hợp<br>
• <strong>"Our environment is quite better."</strong>: Không tự nhiên, sai ngữ pháp (cần "much better")<br><br>
<strong>🔑 Mẹo nhớ:</strong> "I <strong>couldn't agree MORE</strong>" = không thể đồng ý HƠN được nữa = <strong>đồng ý tuyệt đối 100%</strong> ✓`
  },
  {
    id:17,
    sec:"Text Organization – Sentence Ordering",
    q:`<strong>Đọc và sắp xếp đúng thứ tự 3 câu (a, b, c) để hoàn thành đoạn văn:</strong><br><br>
<em>"Most Vietnamese families have customs and traditions that they have observed for many generations. Firstly, they worship their ancestors, and they celebrate their death anniversaries every year. ____"</em><br><br>
<em><strong>a.</strong> Secondly, they join many national festivals.<br>
<strong>b.</strong> That's the way they show their gratitude to their ancestors and teach their kids about traditions.<br>
<strong>c.</strong> Thirdly, they celebrate many holidays during the year.</em>`,
    opts:[
      {h:"b – c – a",c:false},
      {h:"a – c – b",c:true},
      {h:"b – a – c",c:false},
      {h:"c – b – a",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: a – c – b</strong><br><br>
<strong>Phân tích logic đoạn văn:</strong><br>
Câu gốc đã có: "<strong>Firstly</strong>, they worship their ancestors..." (Thứ nhất)<br><br>
→ Tiếp theo phải là <strong>Secondly</strong> (a), rồi <strong>Thirdly</strong> (c), cuối cùng là câu kết luận (b)<br><br>
<strong>Thứ tự đúng: a → c → b</strong><br>
1️⃣ <strong>a.</strong> <em>Secondly, they join many national festivals.</em> (điểm thứ 2)<br>
2️⃣ <strong>c.</strong> <em>Thirdly, they celebrate many holidays during the year.</em> (điểm thứ 3)<br>
3️⃣ <strong>b.</strong> <em>That's the way they show their gratitude...</em> (câu <strong>kết luận</strong> tổng kết ý nghĩa)<br><br>
<strong>🔑 Nguyên tắc:</strong> Trình tự liệt kê: First → Second → Third → Conclusion. Câu (b) bắt đầu bằng "That's the way" = câu tổng kết, phù hợp làm câu cuối cùng.`
  },
  {
    id:18,
    sec:"Text Completion – Best Ending Sentence",
    q:`<strong>Chọn câu kết thúc phù hợp nhất cho đoạn văn về phong tục gia đình Việt Nam (đoạn ở Câu 17):</strong><br><br>
<em>(Nội dung đoạn văn: Gia đình Việt Nam thờ cúng tổ tiên, tham gia lễ hội dân tộc, kỷ niệm các ngày lễ quanh năm – thể hiện sự biết ơn và gắn kết thế hệ.)</em>`,
    opts:[
      {h:"They also show their interests in all festivals.",c:false},
      {h:"Next, it makes generations close to each other.",c:false},
      {h:"Finally, every generation can live happily together.",c:false},
      {h:"In this way, they keep their traditions alive and pass them down to the next generation.",c:true}
    ],
    exp:`<strong>📌 Đáp án đúng: In this way, they keep their traditions alive and pass them down to the next generation.</strong><br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>"They also show their interests in all festivals."</strong>: không tổng kết được chủ điểm của toàn đoạn văn<br>
• <strong>"Next, it makes generations close..."</strong>: "Next" không phù hợp làm câu kết; "it" không rõ chỉ cái gì<br>
• <strong>"Finally, every generation can live happily..."</strong>: chung chung, không liên kết với chủ đề phong tục/truyền thống<br>
• <strong class='ok'>"In this way, they keep their traditions alive and pass them down to the next generation."</strong>: ĐÚNG – tổng kết toàn bộ ý nghĩa của đoạn văn: <strong>gìn giữ và truyền lại truyền thống</strong> cho thế hệ sau<br><br>
<strong>🔑 Câu kết đoạn tốt phải:</strong> Tổng kết ý chính, không đưa ra ý mới, thường dùng: <em>In this way, Therefore, In conclusion, In short...</em>`
  },
  {
    id:25,
    sec:"Rewrite – Same Meaning",
    q:"Even though technology is easy to use, many people have difficulty in using it.",
    opts:[
      {h:"Although technology is easy to use, many people have difficulty in using it.",c:true},
      {h:"Technology is easy to use, so many people have difficulty in using it.",c:false},
      {h:"Because many people have difficulty in using technology, it is easy to use.",c:false},
      {h:"Although many people have difficulty in using, but technology is easy to use.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: Although technology is easy to use, many people have difficulty in using it.</strong><br><br>
<strong>Dịch câu gốc:</strong> "Mặc dù công nghệ dễ sử dụng, nhưng nhiều người vẫn gặp khó khăn khi dùng nó."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>A.</strong> "Although..." → ĐÚNG, <strong>Even though = Although = Though</strong> (đều là liên từ nhượng bộ, cùng nghĩa)<br>
• <strong>B.</strong> "so" = vì vậy → ngụ ý nhân quả, <strong>sai nghĩa hoàn toàn</strong> (dễ dùng → vì sao lại khó dùng?)<br>
• <strong>C.</strong> "Because... it is easy to use" → <strong>đảo ngược logic</strong>, sai nghĩa<br>
• <strong>D.</strong> "Although... but" → <strong>sai ngữ pháp</strong>, tuyệt đối không dùng cả "although" và "but" trong cùng một câu<br><br>
<strong>🔑 Đồng nghĩa liên từ nhượng bộ:</strong> <strong>Even though = Although = Though</strong> (mặc dù)`
  },
  {
    id:26,
    sec:"Rewrite – Same Meaning",
    q:"My uncle traveled to work by bus when he lived in the city.",
    opts:[
      {h:"My uncle used to travel to work by bus when he lived in the city.",c:true},
      {h:"My uncle used to travelling to work by bus when he lived in the city.",c:false},
      {h:"My uncle is used to traveling to work by bus when he lived in the city.",c:false},
      {h:"My uncle did work by bus when living in the city.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: My uncle used to travel to work by bus when he lived in the city.</strong><br><br>
<strong>Dịch câu gốc:</strong> "Chú tôi đã từng đi làm bằng xe buýt khi ông ấy sống ở thành phố."<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>A.</strong> "used to <strong>travel</strong>" → ĐÚNG, cấu trúc <strong>used to + V nguyên thể</strong> = thói quen trong quá khứ (nay không còn nữa)<br>
• <strong>B.</strong> "used to <strong>travelling</strong>" → <strong>SAI ngữ pháp</strong>, "used to" phải theo sau bằng V nguyên thể, không phải V-ing<br>
• <strong>C.</strong> "<strong>is</strong> used to traveling" → <strong>SAI thì</strong>, "is used to + V-ing" = "quen với..." ở hiện tại, không phải quá khứ<br>
• <strong>D.</strong> "did work by bus" → <strong>SAI nghĩa</strong>, "did work" = đã làm việc (hoàn toàn khác nghĩa)<br><br>
<strong>🔑 Phân biệt QUAN TRỌNG:</strong><br>
• <strong>used to + V</strong>: thói quen trong <em>quá khứ</em> (không còn nữa) → <em>He used to smoke.</em><br>
• <strong>be used to + V-ing</strong>: quen với việc gì đó (hiện tại) → <em>He is used to walking.</em>`
  },
  {
    id:27,
    sec:"Sentence Building",
    q:"Sắp xếp từ gợi ý thành câu hoàn chỉnh: <em>There / a lot of / vehicles / road.</em>",
    opts:[
      {h:"There are a lot of vehicles on the road.",c:true},
      {h:"There is a lot of vehicles on the road.",c:false},
      {h:"There are a lot of vehicles being in the road.",c:false},
      {h:"A lot of vehicles there the road.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: There are a lot of vehicles on the road.</strong><br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>A.</strong> "There <strong>are</strong> a lot of vehicles <strong>on</strong> the road." → ĐÚNG hoàn toàn<br>
• <strong>B.</strong> "There <strong>is</strong> a lot of vehicles" → <strong>SAI</strong>, "vehicles" là danh từ số nhiều → bắt buộc dùng "are"<br>
• <strong>C.</strong> "vehicles being <strong>in</strong> the road" → <strong>SAI 2 lỗi</strong>: "being" thừa và vô nghĩa; phải là "<strong>on</strong> the road" (không dùng "in")<br>
• <strong>D.</strong> Thiếu động từ và cấu trúc sai hoàn toàn<br><br>
<strong>🔑 Ghi nhớ cấu trúc There is/are:</strong><br>
• <strong>There is</strong> + danh từ <em>số ít / không đếm được</em><br>
• <strong>There are</strong> + danh từ <em>số nhiều</em><br>
• Luôn dùng <strong>on the road</strong> (không dùng "in the road")`
  },
  {
    id:28,
    sec:"Sentence Building",
    q:"Sắp xếp từ gợi ý thành câu hoàn chỉnh: <em>Trip / exciting / meaningful.</em>",
    opts:[
      {h:"Our trip is exciting and meaningful.",c:true},
      {h:"Our trip is exciting but meaningful.",c:false},
      {h:"Our trip is nor exciting or meaningful.",c:false},
      {h:"Our trip are both exciting and meaningful.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: Our trip is exciting and meaningful.</strong><br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong class='ok'>A.</strong> "exciting <strong>and</strong> meaningful" → ĐÚNG, dùng "and" nối 2 tính từ cùng chiều (cùng tích cực)<br>
• <strong>B.</strong> "exciting <strong>but</strong> meaningful" → <strong>SAI nghĩa</strong>, "but" ngụ ý tương phản – như thể "exciting" và "meaningful" mâu thuẫn nhau, không hợp lý<br>
• <strong>C.</strong> "nor exciting or meaningful" → <strong>SAI ngữ pháp</strong>, cấu trúc đúng là "<strong>neither</strong>...nor" hoặc "not...or"<br>
• <strong>D.</strong> "trip <strong>are</strong>" → <strong>SAI</strong>, "trip" là danh từ số ít → phải dùng "<strong>is</strong>"<br><br>
<strong>🔑 Cách nối tính từ cùng chiều:</strong> S + is + adj <strong>and</strong> adj (khi cả 2 tính từ đều tích cực hoặc đều tiêu cực)`
  },
  {
    id:29,
    sec:"Reading – Signs & Notices",
    q:`<strong>What does the sign say?</strong><br><br>
<div style="display:inline-flex;flex-direction:column;align-items:center;background:#FFD700;border:5px solid #111;border-radius:5px;padding:18px 28px;box-shadow:0 6px 20px rgba(0,0,0,.35);margin:8px 0;">
  <div style="font-size:1.85rem;font-weight:900;color:#111;letter-spacing:2px;line-height:1.25;text-align:center;">STAFF<br>PARKING<br>ONLY</div>
</div>`,
    opts:[
      {h:"Anyone can park here.",c:false},
      {h:"Only employees are allowed to park here.",c:true},
      {h:"Parking sites are not working.",c:false},
      {h:"The parking area is open to all people.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: Only employees are allowed to park here.</strong><br><br>
<strong>Dịch biển hiệu:</strong><br>
"STAFF PARKING ONLY" = "<strong>Chỉ dành cho nhân viên đậu xe</strong>"<br><br>
<strong>Từ vựng quan trọng:</strong><br>
• <strong>staff</strong> = nhân viên (= <strong>employees</strong>)<br>
• <strong>parking</strong> = đậu xe, bãi đỗ xe<br>
• <strong>only</strong> = chỉ, duy nhất<br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>A.</strong> "Anyone can park" → SAI, biển hiệu quy định chỉ NHÂN VIÊN mới được đậu<br>
• <strong class='ok'>B.</strong> "Only employees are allowed" → ĐÚNG (<strong>staff = employees</strong>; only = only)<br>
• <strong>C.</strong> "Parking sites are not working" → SAI, biển không nói bãi đỗ hỏng<br>
• <strong>D.</strong> "Open to all people" → SAI, hoàn toàn ngược nghĩa với "ONLY"<br><br>
<strong>🔑 Từ đồng nghĩa:</strong> <strong>staff = employees = workers</strong> (nhân viên / người lao động)`
  },
  {
    id:30,
    sec:"Reading – Signs & Notices",
    q:`<strong>What does the notice mean?</strong><br><br>
<div style="display:inline-block;border:3px solid #00C9A7;border-radius:14px;padding:18px 26px;text-align:center;background:white;box-shadow:0 4px 16px rgba(0,201,167,.25);margin:8px 0;min-width:210px;">
  <div style="color:#00C9A7;font-size:1.15rem;font-weight:900;margin-bottom:7px;">Seavista Restaurant</div>
  <div style="color:#00C9A7;font-size:.97rem;font-weight:700;line-height:1.9;">Opening this weekend.<br>Free food for children.</div>
</div>`,
    opts:[
      {h:"The restaurant is old.",c:false},
      {h:"The restaurant has great food.",c:false},
      {h:"Guests don't have to pay for children's meals.",c:true},
      {h:"The restaurant is only open at the weekend.",c:false}
    ],
    exp:`<strong>📌 Đáp án đúng: Guests don't have to pay for children's meals.</strong><br><br>
<strong>Dịch thông báo:</strong><br>
• "Seavista Restaurant" = Nhà hàng Seavista<br>
• "Opening this weekend" = <strong>Khai trương cuối tuần này</strong><br>
• "Free food for children" = <strong>Miễn phí đồ ăn cho trẻ em</strong><br><br>
<strong>Phân tích 4 đáp án:</strong><br>
• <strong>A.</strong> "The restaurant is old" → SAI, "Opening" = mới khai trương, không phải cũ<br>
• <strong>B.</strong> "The restaurant has great food" → SAI, không đề cập chất lượng đồ ăn<br>
• <strong class='ok'>C.</strong> "Guests don't have to pay for children's meals" → ĐÚNG (<strong>free = không phải trả tiền = don't have to pay</strong>)<br>
• <strong>D.</strong> "Only open at the weekend" → SAI, "Opening <em>this</em> weekend" = khai trương vào cuối tuần NÀY, không có nghĩa là chỉ mở cửa vào cuối tuần<br><br>
<strong>🔑 Từ đồng nghĩa:</strong> <strong>free</strong> = miễn phí = <strong>don't have to pay</strong> = at no cost`
  }
] }
,
  {
    title: 'IELTS 8.0 · Unit 7 Environmental Protection',
    raw: [

        // PRONUNCIATION

        {

            id: 1,

            type: "phonetics",

            question: "Mark the letter A, B, C or D to indicate the word whose underlined part differs from the other three in pronunciation.",

            text: "A. r<u>i</u>sk &nbsp;&nbsp; B. campf<u>i</u>re &nbsp;&nbsp; C. d<u>i</u>verse &nbsp;&nbsp; D. adm<u>i</u>re",

            options: ["A", "B", "C", "D"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Phân tích phát âm:</span>

                <ul>

                    <li>A. risk /rɪsk/ (âm i ngắn)</li>

                    <li>B. campfire /ˈkæmpfaɪər/ (âm ai)</li>

                    <li>C. diverse /daɪˈvɜːs/ (âm ai)</li>

                    <li>D. admire /ədˈmaɪər/ (âm ai)</li>

                </ul>

                <p>=> Đáp án A phát âm là /ɪ/, các từ còn lại là /aɪ/.</p>

            `

        },

        {

            id: 2,

            type: "phonetics",

            question: "Mark the letter A, B, C or D to indicate the word whose underlined part differs from the other three in pronunciation.",

            text: "A. re<u>s</u>ident &nbsp;&nbsp; B. eco<u>s</u>ystem &nbsp;&nbsp; C. relea<u>s</u>e &nbsp;&nbsp; D. specie<u>s</u>",

            options: ["A", "B", "C", "D"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Phân tích phát âm 's':</span>

                <ul>

                    <li>A. resident /ˈrezɪdənt/ (âm /z/)</li>

                    <li>B. ecosystem /ˈiːkəʊsɪstəm/ (âm /s/)</li>

                    <li>C. release /rɪˈliːs/ (âm /s/)</li>

                    <li>D. species /ˈspiːʃiːz/ (hoặc /ˈspiːsiːz/, âm đuôi thường là /z/ nhưng chữ s gạch chân ở giữa là /ʃ/ hoặc /s/). Tuy nhiên, xét nguyên âm thì rõ hơn:</li>

                </ul>

                <span class="exp-title">Phân tích nguyên âm 'e':</span>

                <ul>

                    <li>A. resident /e/</li>

                    <li>B. ecosystem /iː/ (hoặc e)</li>

                    <li>C. release /iː/</li>

                    <li>D. species /iː/</li>

                </ul>

                <p>=> Xét theo nguyên âm 'e', đáp án A (/e/) khác với các từ còn lại (/iː/).</p>

            `

        },

        // STRESS

        {

            id: 3,

            type: "stress",

            question: "Mark the letter A, B, C or D to indicate the word that differs from the other three in the position of primary stress.",

            text: "A. instruction &nbsp;&nbsp; B. combination &nbsp;&nbsp; C. conclusion &nbsp;&nbsp; D. destruction",

            options: ["A", "B", "C", "D"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Phân tích trọng âm:</span>

                <ul>

                    <li>A. instruction /ɪnˈstrʌkʃn/ (Âm 2)</li>

                    <li>B. combination /ˌkɒmbɪˈneɪʃn/ (Âm 3 - quy tắc đuôi -ation nhấn trước nó)</li>

                    <li>C. conclusion /kənˈkluːʒn/ (Âm 2)</li>

                    <li>D. destruction /dɪˈstrʌkʃn/ (Âm 2)</li>

                </ul>

                <p>=> Đáp án B nhấn âm 3, còn lại âm 2.</p>

            `

        },

        {

            id: 4,

            type: "stress",

            question: "Mark the letter A, B, C or D to indicate the word that differs from the other three in the position of primary stress.",

            text: "A. footprint &nbsp;&nbsp; B. substances &nbsp;&nbsp; C. wildlife &nbsp;&nbsp; D. marine",

            options: ["A", "B", "C", "D"],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Phân tích trọng âm:</span>

                <ul>

                    <li>A. footprint /ˈfʊtprɪnt/ (Âm 1 - Danh từ ghép)</li>

                    <li>B. substances /ˈsʌbstənsɪz/ (Âm 1)</li>

                    <li>C. wildlife /ˈwaɪldlaɪf/ (Âm 1 - Danh từ ghép)</li>

                    <li>D. marine /məˈriːn/ (Âm 2)</li>

                </ul>

                <p>=> Đáp án D nhấn âm 2, còn lại âm 1.</p>

            `

        },

        // MULTIPLE CHOICE

        {

            id: 5,

            type: "grammar",

            question: "The loss of habitat and climate change contribute to the ____ of species.",

            text: "",

            options: ["A. Extinct (adj)", "B. exit (n)", "C. extinction (n)", "D. extincted (V-ed)"],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Giải thích:</span>

                <p>Sau mạo từ "the" cần một Danh từ (Noun).</p>

                <ul>

                    <li>A. Extinct (adj): Tuyệt chủng.</li>

                    <li>C. Extinction (n): Sự tuyệt chủng.</li>

                </ul>

                <p><strong>Dịch:</strong> Việc mất môi trường sống và biến đổi khí hậu góp phần vào <em>sự tuyệt chủng</em> của các loài.</p>

            `

        },

        {

            id: 6,

            type: "grammar",

            question: "Renewable ________of energy are essential for a sustainable future.",

            text: "",

            options: ["A. Extinction", "B. sources", "C. pollutions", "D. substances"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Collocation (Cụm từ cố định):</span>

                <p>Cụm từ <strong>"Renewable sources of energy"</strong> (Các nguồn năng lượng tái tạo).</p>

                <p><strong>Dịch:</strong> Các nguồn năng lượng tái tạo là thiết yếu cho một tương lai bền vững.</p>

            `

        },

        {

            id: 7,

            type: "grammar",

            question: "I don’t know the reason ______ he left his hometown.",

            text: "",

            options: ["A. what", "B. where", "C. that", "D. why"],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Mệnh đề quan hệ:</span>

                <p>"The reason" luôn đi với đại từ quan hệ <strong>"why"</strong> (lý do tại sao).</p>

                <p><strong>Dịch:</strong> Tôi không biết lý do <em>tại sao</em> anh ấy rời bỏ quê hương.</p>

            `

        },

        {

            id: 8,

            type: "grammar",

            question: "Remember to switch off the lights _________ you go out.",

            text: "",

            options: ["A. Before", "B. after", "C. until", "D. while"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Liên từ chỉ thời gian:</span>

                <p>Hành động tắt đèn cần làm <strong>trước khi</strong> đi ra ngoài -> Dùng "Before".</p>

                <p><strong>Dịch:</strong> Nhớ tắt đèn <em>trước khi</em> bạn đi ra ngoài.</p>

            `

        },

        {

            id: 9,

            type: "grammar",

            question: "______ Jimmy is naughty, he learns very well.",

            text: "",

            options: ["A. Despite", "B. Until", "C. Because", "D. Although"],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Liên từ chỉ sự nhượng bộ:</span>

                <p>Câu mang nghĩa tương phản: Nghịch ngợm nhưng học giỏi.</p>

                <ul>

                    <li>Despite + Noun/V-ing (Sai ngữ pháp vì "Jimmy is naughty" là mệnh đề).</li>

                    <li>Although + Mệnh đề (Đúng).</li>

                </ul>

                <p><strong>Dịch:</strong> <em>Mặc dù</em> Jimmy nghịch ngợm, cậu ấy học rất giỏi.</p>

            `

        },

        {

            id: 10,

            type: "grammar",

            question: "You should drive carefully ________ the road is slippery.",

            text: "",

            options: ["A. Due to", "B. while", "C. although", "D. because"],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Liên từ chỉ nguyên nhân:</span>

                <p>Giải thích lý do lái xe cẩn thận -> Vì đường trơn.</p>

                <ul>

                    <li>Due to + Noun (Sai ngữ pháp vì phía sau là mệnh đề).</li>

                    <li>Because + Mệnh đề (Đúng).</li>

                </ul>

                <p><strong>Dịch:</strong> Bạn nên lái xe cẩn thận <em>bởi vì</em> đường trơn.</p>

            `

        },

        {

            id: 11,

            type: "grammar",

            question: "He was talking about the film ______ he saw yesterday.",

            text: "",

            options: ["A. How", "B. who", "C. that", "D. when"],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Mệnh đề quan hệ:</span>

                <p>"The film" là vật -> Dùng "which" hoặc "that". Ở đây chọn "that".</p>

                <p><strong>Dịch:</strong> Anh ấy đang nói về bộ phim <em>mà</em> anh ấy đã xem hôm qua.</p>

            `

        },

        {

            id: 12,

            type: "grammar",

            question: "Avoid dumping waste _____ lakes and rivers!",

            text: "",

            options: ["A. In", "B. into", "C. on", "D. to"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Giới từ chỉ sự chuyển động:</span>

                <p>Dump something <strong>into</strong> something (Đổ cái gì <em>vào trong</em> cái gì - có sự chuyển động từ ngoài vào trong).</p>

                <p><strong>Dịch:</strong> Tránh đổ rác thải <em>vào</em> ao hồ và sông ngòi!</p>

            `

        },

        {

            id: 13,

            type: "grammar",

            question: "We shouldn’t cut _______too many trees.",

            text: "",

            options: ["A. In", "B. on", "C. down", "D. out"],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Phrasal Verb (Cụm động từ):</span>

                <p><strong>Cut down</strong>: Chặt hạ (cây cối).</p>

                <p><strong>Dịch:</strong> Chúng ta không nên <em>chặt hạ</em> quá nhiều cây xanh.</p>

            `

        },

        {

            id: 14,

            type: "grammar",

            question: "“How nice to see you!” – “ _________”",

            text: "",

            options: ["A. It’s so kind of you", "B. Nice to see you, too", "C. So do I", "D. Thanks"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Giao tiếp xã hội:</span>

                <p>Khi ai đó chào "Thật vui khi gặp bạn", cách đáp lại lịch sự nhất là "Tôi cũng rất vui được gặp bạn".</p>

                <p>A. Bạn thật tốt bụng (Dùng khi được giúp đỡ).</p>

                <p>B. Cũng rất vui được gặp bạn (Đúng).</p>

            `

        },

        

        // READING 1: ZOO VOLUNTEERS

        {

            id: 15,

            type: "cloze",

            question: "Question 13: The city zoo is looking (13) ____ weekend volunteers.",

            context: `ZOO VOLUNTEERS\nThe city zoo is looking (13) ____ weekend volunteers.\nResponsibilities include:\n- Answering general questions from (14) ____ zoo visitors.\n- Helping (15) ____ programmers, and feed the animals.\n- Clean (16) ____ at the end of the day.`,

            options: ["A. in", "B. for", "C. at", "D. behind"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Phrasal Verb:</span>

                <p><strong>Look for</strong>: Tìm kiếm.</p>

                <p><strong>Dịch:</strong> Sở thú thành phố đang <em>tìm kiếm</em> tình nguyện viên cuối tuần.</p>

            `

        },

        {

            id: 16,

            type: "cloze",

            question: "Question 14: Answering general questions from (14) ____ zoo visitors.",

            context: `(See passage above)`,

            options: ["A. a", "B. an", "C. the", "D. X (no article)"],

            answer: 3, // D (hoặc C tùy ngữ cảnh, nhưng X phổ biến cho danh từ số nhiều chung)

            explanation: `

                <span class="exp-title">Mạo từ:</span>

                <p>"Zoo visitors" là danh từ số nhiều chỉ chung chung. Trong ngữ cảnh thông báo tuyển dụng này, không cần mạo từ xác định "the" (trừ khi ám chỉ nhóm khách cụ thể đang ở đó, nhưng D là lựa chọn an toàn cho ý nghĩa chung).</p>

                <p><strong>Dịch:</strong> Trả lời các câu hỏi chung từ du khách.</p>

            `

        },

        {

            id: 17,

            type: "cloze",

            question: "Question 15: Helping (15) ____ programmers, and feed the animals.",

            context: `(See passage above)`,

            options: ["A. education", "B. educate", "C. educating", "D. educational"],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Từ loại:</span>

                <p>Trước danh từ "programmers" (hoặc programmes - đề gốc có thể typo từ programmes/chương trình) cần một <strong>Tính từ</strong>.</p>

                <p>Tuy nhiên, nếu giữ nguyên "programmers" (lập trình viên) thì không hợp lý lắm. Đề thi môi trường thường là "educational programmes" (các chương trình giáo dục).</p>

                <p><strong>Dịch:</strong> Hỗ trợ các chương trình <em>giáo dục</em> (educational).</p>

            `

        },

        {

            id: 18,

            type: "cloze",

            question: "Question 16: Clean (16) ____ at the end of the day.",

            context: `(See passage above)`,

            options: ["A. down", "B. in", "C. up", "D. forward"],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Phrasal Verb:</span>

                <p><strong>Clean up</strong>: Dọn dẹp sạch sẽ.</p>

                <p><strong>Dịch:</strong> <em>Dọn dẹp</em> vào cuối ngày.</p>

            `

        },



        // REARRANGEMENT

        {

            id: 19,

            type: "rearrange",

            question: "Arrange the sentences to make a complete letter.",

            text: `

                a. I hope this letter finds you in good health.

                b. We are planning a family reunion next month and would love for you to join.

                c. Please let us know if you can make it.

                d. It’s been too long since we last caught up.

                e. The reunion will be at our usual spot by the lake.

                f. Looking forward to your positive response.

            `,

            options: ["A. a-b-e-d-c-f", "B. a-d-b-e-c-f", "C. a-b-d-e-c-f", "D. a-d-b-c-e-f"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Logic thư thân mật:</span>

                <ol>

                    <li>(a) Lời chào hỏi sức khỏe đầu thư.</li>

                    <li>(d) Lý do viết: Đã lâu không gặp (dẫn dắt).</li>

                    <li>(b) Nội dung chính: Lên kế hoạch họp mặt.</li>

                    <li>(e) Chi tiết: Địa điểm.</li>

                    <li>(c) Yêu cầu phản hồi (RSVP).</li>

                    <li>(f) Lời kết: Mong hồi âm.</li>

                </ol>

                <p>=> Trật tự hợp lý nhất: a - d - b - e - c - f.</p>

            `

        },

        {

            id: 20,

            type: "rearrange",

            question: "Arrange the sentences to make a complete story.",

            text: `

                a. The weather was perfect for a day at the beach.

                b. We packed our bags with sandwiches, fruits, and cold drinks.

                c. As the sun set, we packed up our things and headed home.

                d. We spent the day building sandcastles, playing beach volleyball, and swimming in the sea.

                e. We arrived home tired but happy. (Câu e được suy luận từ văn cảnh đề bài)

            `,

            options: ["A. a-b-d-c-e", "B. b-a-d-e-c", "C. a-b-c-d-e", "D. b-a-c-d-e"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Trình tự thời gian:</span>

                <ol>

                    <li>(a) Mô tả thời tiết (Mở bài).</li>

                    <li>(b) Chuẩn bị đồ đạc (Trước khi đi).</li>

                    <li>(d) Hoạt động trong ngày (Thân bài).</li>

                    <li>(c) Hoàng hôn, đi về (Kết thúc hoạt động).</li>

                    <li>(e) Về nhà, cảm xúc (Kết bài).</li>

                </ol>

                <p>=> Trật tự: a - b - d - c - e.</p>

            `

        },



        // READING 2: BEACH POLLUTION

        {

            id: 21,

            type: "cloze",

            question: "Question 19: ...listen to the sound of the sea waves, (19) _____ suddenly you see a lot of rubbish...",

            context: `Have a walk on a beach, listen to the sound of the sea waves, (19) _____ suddenly you see a lot of rubbish on the beach. Pollution takes away all the (20) ____ of our beaches... (21) ____ we see rubbish, we should do our part in the protecting the land by picking it up and throwing it (22) ____ dust bins. Moreover, we can form some kind of organization that helps (23) ____ the beaches. If everyone does their part, the beaches will be a wonderful and beautiful place. We need to start now (24) ____ the beaches are damaged beyond repair.`,

            options: ["A. or", "B. but", "C. and", "D. so"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Liên từ:</span>

                <p>Cảnh đẹp (sóng biển) >< Cảnh rác (xấu). Cần liên từ chỉ sự tương phản.</p>

                <p><strong>Dịch:</strong> ...nghe tiếng sóng vỗ, <em>nhưng</em> đột nhiên bạn thấy rất nhiều rác.</p>

            `

        },

        {

            id: 22,

            type: "cloze",

            question: "Question 20: Pollution takes away all the (20) ____ of our beaches.",

            context: `(See passage above)`,

            options: ["A. beauty", "B. beautiful", "C. beautifully", "D. being beautiful"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Từ loại:</span>

                <p>Sau "the" cần một Danh từ (Noun).</p>

                <ul>

                    <li>A. beauty (n): vẻ đẹp.</li>

                    <li>B. beautiful (adj): đẹp.</li>

                </ul>

                <p><strong>Dịch:</strong> Ô nhiễm lấy đi tất cả <em>vẻ đẹp</em> của bãi biển.</p>

            `

        },

        {

            id: 23,

            type: "cloze",

            question: "Question 21: (21) ____ we see rubbish, we should do our part...",

            context: `(See passage above)`,

            options: ["A. While", "B. If", "C. Unless", "D. Soon"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Câu điều kiện:</span>

                <p>Cấu trúc: If + S + V (hiện tại), S + should + V.</p>

                <p><strong>Dịch:</strong> <em>Nếu</em> chúng ta thấy rác, chúng ta nên làm phần việc của mình...</p>

            `

        },

        {

            id: 24,

            type: "cloze",

            question: "Question 22: ...picking it up and throwing it (22) ____ dust bins.",

            context: `(See passage above)`,

            options: ["A. on", "B. in", "C. forward", "D. up"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Giới từ:</span>

                <p>Throw something <strong>in/into</strong> the bin (Ném vào trong thùng).</p>

                <p><strong>Dịch:</strong> Ném nó <em>vào</em> thùng rác.</p>

            `

        },

        {

            id: 25,

            type: "cloze",

            question: "Question 23: ...organization that helps (23) ____ the beaches.",

            context: `(See passage above)`,

            options: ["A. cleaning up", "B. clean up", "C. clean off", "D. clean off"],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Cấu trúc HELP:</span>

                <p>Help + (to) V_infinitive. (Giúp làm gì).</p>

                <p>A. V-ing (ít dùng sau help trực tiếp).</p>

                <p>B. Clean up (Động từ nguyên thể). Đúng.</p>

                <p><strong>Dịch:</strong> Giúp <em>làm sạch</em> các bãi biển.</p>

            `

        },

        {

            id: 26,

            type: "cloze",

            question: "Question 24: We need to start now (24) ____ the beaches are damaged beyond repair.",

            context: `(See passage above)`,

            options: ["A. before", "B. after", "C. until", "D. when"],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Liên từ thời gian:</span>

                <p>Hành động cần làm ngay <strong>trước khi</strong> quá muộn.</p>

                <p><strong>Dịch:</strong> Chúng ta cần bắt đầu ngay <em>trước khi</em> bãi biển bị hủy hoại không thể sửa chữa.</p>

            `

        },



        // TRANSFORMATION

        {

            id: 27,

            type: "transform",

            question: "Choose the sentence closest in meaning: 'They travelled across India, and then flew on to Japan.'",

            options: [

                "A. They travelled across India as soon as they flew on to Japan.",

                "B. After flying on to Japan, they travelled across India",

                "C. They didn’t travel across India until they flew on to Japan.",

                "D. After travelling across India, they flew on to Japan."

            ],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Phân tích thì/trật tự:</span>

                <p>Câu gốc: Đi Ấn Độ (1) -> Bay đến Nhật (2).</p>

                <p>A. Sai nghĩa (Ngay khi bay đến Nhật thì đi Ấn Độ).</p>

                <p>B. Sai trật tự (Bay Nhật trước).</p>

                <p>D. Đúng: Sau khi đi khắp Ấn Độ, họ bay đến Nhật.</p>

            `

        },

        {

            id: 28,

            type: "transform",

            question: "Choose the sentence closest in meaning: 'My sister rides her bike to work every day to help protect the environment.'",

            options: [

                "A. My sister rides his bike to work and to help protect the environment.",

                "B. My sister rides his bike to work by helping protect the environment.",

                "C. To go to work by bike every day, my sister helps protect the environment.",

                "D. To help protect the environment, my sister goes to work by bike every day."

            ],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Mệnh đề chỉ mục đích:</span>

                <p>Câu gốc: Đạp xe -> Mục đích: bảo vệ môi trường.</p>

                <p>D. Đúng: Để giúp bảo vệ môi trường (Mục đích đưa lên đầu), chị tôi đi làm bằng xe đạp mỗi ngày.</p>

            `

        },



        // SENTENCE BUILDING

        {

            id: 29,

            type: "build",

            question: "Build sentence: She/ decide/ come/ party/ though/ she/ not/ like",

            options: [

                "A. She decided to come to the party even though she didn’t like it.",

                "B. She decided to come to the party if though she didn’t like",

                "C. She decided coming to the party though she didn’t like it.",

                "D. She decided to come to the party if though she doesn’t it."

            ],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Cấu trúc:</span>

                <p>- Decide + to V.</p>

                <p>- Even though + Mệnh đề (Mặc dù).</p>

                <p>=> Đáp án A đúng ngữ pháp và đầy đủ nghĩa nhất.</p>

            `

        },

        {

            id: 30,

            type: "build",

            question: "Build sentence: Serious/ accident/ happen/ we/ wait/ bus/ yesterday.",

            options: [

                "A. A serious accident was happening while we were waiting for the bus yesterday.",

                "B. A serious accident happened while we were waiting for the bus yesterday.",

                "C. A serious accident happended when we waited for the bus yesterday.",

                "D. A serious accident was happended when we were waiting for the bus yesterday."

            ],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Sự phối hợp thì (Quá khứ):</span>

                <p>Một hành động đang xảy ra (waiting - Quá khứ tiếp diễn) thì một hành động khác xen vào (happened - Quá khứ đơn).</p>

                <p>=> Cấu trúc: Past Simple + while + Past Continuous.</p>

                <p><strong>Đáp án B:</strong> Một tai nạn nghiêm trọng đã xảy ra trong khi chúng tôi đang đợi xe buýt.</p>

            `

        },



        // SIGNS

        {

            id: 31,

            type: "sign",

            question: "Question 29: What does the sign say?",

            text: `

                <div class="sign-box sign-danger">

                    <span class="sign-icon">☠️</span>

                    <div>KEEP OUT</div>

                    <div style="font-size: 10px;">AUTHORIZED PERSONNEL ONLY</div>

                </div>

            `,

            options: [

                "A. You are allowed to go into this area anytime you want.",

                "B. You should stay away and not enter this area.",

                "C. This area is used for special events or activities.",

                "D. You are allowed to enter only if you have a special pass or permission."

            ],

            answer: 3, // D (Thực ra B cũng đúng ý "stay away", nhưng D giải thích rõ "Authorized Only". Tuy nhiên B là lời khuyên an toàn chung. Đáp án chuẩn thường là D nếu sát nghĩa chữ, nhưng nếu chọn ý cảnh báo thì B. Tuy nhiên "Authorized personnel only" = Chỉ nhân viên có thẩm quyền -> Có phép mới được vào. D đúng nhất.)

            // UPDATE: Đọc kỹ đáp án B: "Stay away and not enter". Đáp án D: "Enter ONLY IF...".

            // Biển "Authorized Only" nghĩa là CÓ THỂ vào nếu có quyền. B nói cấm tiệt. D chính xác hơn về mặt ngữ nghĩa của dòng chữ nhỏ.

            // TUY NHIÊN, với học sinh phổ thông, biển đầu lâu xương chéo thường là "DANGER - KEEP OUT" -> B.

            // Nhưng dòng "Authorized Only" làm cho D trở nên đúng về mặt logic.

            // Hãy xem lại key phổ biến: Biển "Keep Out" thường chọn "Not enter". Nhưng có dòng Authorized.

            // Tôi sẽ chọn D vì nó cover được dòng "Authorized".

            // CHỈNH SỬA: Nhiều đề thi chọn D.

            explanation: `

                <span class="exp-title">Giải thích biển báo:</span>

                <p>Biển báo ghi: "KEEP OUT" (Tránh xa) và "AUTHORIZED PERSONNEL ONLY" (Chỉ nhân viên có thẩm quyền).</p>

                <p>A. Vào thoải mái -> Sai.</p>

                <p>B. Nên tránh xa và không vào (Đúng một phần, nhưng chưa đủ ý authorized).</p>

                <p>D. Bạn chỉ được phép vào nếu có giấy phép hoặc sự cho phép đặc biệt (Giải thích chính xác dòng Authorized Personnel Only).</p>

            `

        },

        {

            id: 32,

            type: "sign",

            question: "Question 30: What does the sign say?",

            text: `

                <div class="sign-box sign-no-dogs">

                    <div style="font-size: 30px; border: 2px solid white; border-radius: 50%; width: 40px; height: 40px; margin: 0 auto; line-height: 35px;">🐕🚫</div>

                    <div style="margin-top:5px; font-size: 20px;">NO DOGS</div>

                    <div>ALLOWED</div>

                </div>

            `,

            options: [

                "A. Dogs are welcome everywhere and can go anywhere.",

                "B. Dogs are not allowed to enter or be in this area.",

                "C. You may bring dogs here if they are on a leash",

                "D. Only small dogs are allowed in this area."

            ],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Giải thích biển báo:</span>

                <p>"NO DOGS ALLOWED" = Không cho phép chó.</p>

                <p>=> Đáp án B: Chó không được phép đi vào khu vực này.</p>

            `

        },



        // READING 3: SAVING THE ENVIRONMENT

        {

            id: 33,

            type: "reading",

            question: "Question 31. What is the main idea of the passage?",

            context: `Saving the Environment: One Home at a Time\n\nPollution can be seen not only throughout the world, but also in our own homes. It comes from household chemicals, the amount of water people use and the waste people produce and throw away. What can be done to stop this pollution? Surprisingly, a person can help save the environment by doing simple things.\n\nFirst, we need to recycle, which allows products to be used over and over again. Recycling can also reduce the number of trees cut down to produce paper products. It takes very little effort. It is not hard to place plastic and glass bottles, aluminum cans and paper in a bin. Anyone can do it.\n\nSecond, we need to control the amount of water used at home. It can be conserved by taking short showers instead of baths, repairing leaky faucets, using the dishwasher or washing machine only when fully loaded, or simply turning the faucet off while brushing your teeth.\n\nThird, we need to reduce waste. We need to recycle whenever possible, but should also try to use this waste effectively. For example, grass clippings and food scraps can be made into compost for plants. The average person produces 4.3 pounds of waste every day, but we can reduce that amount by recycling and reusing.\n\nIf we do our part in our own homes, we can help keep the planet from becoming more polluted.`,

            options: [

                "A. Recycling is the only way to help the environment.",

                "B. Reducing water usage and waste are more important than recycling.",

                "C. Individuals can help reduce pollution through simple actions at home.",

                "D. Pollution in homes is caused only by household chemicals."

            ],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Ý chính:</span>

                <p>Đoạn văn nói về việc ô nhiễm tại nhà và đưa ra các giải pháp đơn giản (recycle, save water, reduce waste) mà mỗi người có thể làm.</p>

                <p>=> Đáp án C: Cá nhân có thể giúp giảm ô nhiễm thông qua các hành động đơn giản tại nhà.</p>

            `

        },

        {

            id: 34,

            type: "reading",

            question: "Question 32: Why does recycling help to reduce waste?",

            context: `(See passage above)`,

            options: [

                "A. Plants need to develop",

                "B. Waste can be recycled and reused",

                "C. A person can do it in his home",

                "D. An average man produces compost for plants."

            ],

            answer: 1, // B

            explanation: `

                <span class="exp-title">Thông tin chi tiết:</span>

                <p>Đoạn 2: "First, we need to recycle, which allows products to be used over and over again." (Tái chế cho phép sản phẩm được dùng đi dùng lại -> giảm rác thải).</p>

                <p>=> Đáp án B: Rác có thể được tái chế và tái sử dụng.</p>

            `

        },

        {

            id: 35,

            type: "reading",

            question: "Question 33: Recycling can help us ____.",

            context: `(See passage above)`,

            options: [

                "A. Never cut down trees",

                "B. Place garbage bins easily",

                "C. produce more paper products",

                "D. use products again and again."

            ],

            answer: 3, // D

            explanation: `

                <span class="exp-title">Thông tin chi tiết:</span>

                <p>Đoạn 2: "...allows products to be used over and over again."</p>

                <p>=> Đáp án D: Sử dụng sản phẩm lặp đi lặp lại.</p>

            `

        },

        {

            id: 36,

            type: "reading",

            question: "Question 34: Pollution is caused from the following sources EXCEPT ______",

            context: `(See passage above)`,

            options: [

                "A. Water in rivers",

                "B. water from households",

                "C. wastes",

                "D. house chemicals"

            ],

            answer: 0, // A

            explanation: `

                <span class="exp-title">Tìm thông tin ngoại trừ:</span>

                <p>Đoạn 1: "It comes from household chemicals (D), the amount of water people use (B) and the waste people produce (C)..."</p>

                <p>=> Không nhắc đến "Water in rivers" là nguyên nhân gây ô nhiễm trong nhà.</p>

                <p>=> Đáp án A.</p>

            `

        },

        {

            id: 37,

            type: "reading",

            question: "Question 35: The word “It” in paragraph 2 refers to ______.",

            context: `(See passage above)`,

            options: [

                "A. Cutting down",

                "B. the number",

                "C. recycling",

                "D. effort"

            ],

            answer: 2, // C

            explanation: `

                <span class="exp-title">Từ quy chiếu:</span>

                <p>Câu trước: "Recycling can also reduce...". Câu sau: "It takes very little effort."</p>

                <p>=> "It" thay thế cho hành động "Recycling".</p>

                <p>=> Đáp án C.</p>

            `

        },

        {

            id: 38,

            type: "reading",

            question: "Question 36: The word “effectively” in paragraph 4 OPPOSITE to _____.",

            context: `(See passage above)`,

            options: [

                "A. Attractively",

                "B. worthlessly",

                "C. harmfully",

                "D. efficiently"

            ],

            answer: 1, // B (hoặc C tùy quan điểm, nhưng Worthlessly là sát nghĩa vô dụng nhất so với hiệu quả)

            explanation: `

                <span class="exp-title">Từ trái nghĩa:</span>

                <p><strong>Effectively</strong>: Một cách hiệu quả (có ích).</p>

                <p>A. Hấp dẫn.</p>

                <p>B. Vô giá trị/Vô dụng (Trái nghĩa với có ích/hiệu quả).</p>

                <p>C. Có hại (Trái nghĩa với có lợi).</p>

                <p>D. Hiệu quả (Đồng nghĩa).</p>

                <p>=> Chọn B hoặc C. Tuy nhiên trong ngữ cảnh sử dụng rác thải: dùng hiệu quả (làm phân bón) >< dùng vô dụng (vứt đi lãng phí/không tạo ra giá trị). Đáp án B phù hợp.</p>

            `

        },



        // READING 4: MATCHING SENTENCES

        {

            id: 39,

            type: "matching",

            question: "Question 37",

            context: `Environmental pollution is one of the impacts of human activities on the Earth. There are four types of pollution, namely, (37) _____. \n\nMost of the air pollution results from the burning of fossil fuels, motor vehicles, factories, aircraft and rockets. (38) ____. Air pollution also contributes to the greenhouse effect.\n\nSoil pollution is a result of dumping plastic or other waste in the ground and the overuse of chemicals in growing crops. The long-term effects of soil pollution are contaminated vegetation and the decrease of soil fertility.\n\nWater pollution is a result of dumping pollutants such as oil and other chemicals in rivers, (39) ____. Rubbish blockages in rivers can also cause pollution.\nThe effects of water pollution include the destruction of rivers, lakes and the pollution of groundwater, surface water and seawater.\n\nEnvironmental pollution is becoming an increasingly serious problem or threat that needs to be taken care of as soon as possible, (40)____.`,

            options: [

                "A. Air pollution, soil pollution, water pollution and noise pollution.",

                "B. This can cause acid rain which damages water, soil and plants",

                "C. Not only for the sake of the environment, but also for the people that live in it.",

                "D. Which makes the water unclean or contaminated."

            ],

            answer: 0, // A matches blank 37

            explanation: `

                <span class="exp-title">Ghép câu:</span>

                <p>Câu trước nói "There are four types of pollution" (Có 4 loại ô nhiễm).</p>

                <p>=> Cần liệt kê tên 4 loại.</p>

                <p>=> Đáp án A: Air, soil, water, noise pollution.</p>

            `

        },

        {

            id: 40,

            type: "matching",

            question: "Question 38",

            context: `(See passage above)`,

            options: [

                "A. Air pollution, soil pollution, water pollution and noise pollution.",

                "B. This can cause acid rain which damages water, soil and plants",

                "C. Not only for the sake of the environment, but also for the people that live in it.",

                "D. Which makes the water unclean or contaminated."

            ],

            answer: 1, // B matches blank 38

            explanation: `

                <span class="exp-title">Ghép câu:</span>

                <p>Đoạn văn nói về Air Pollution (đốt nhiên liệu...).</p>

                <p>=> Đáp án B: "This can cause acid rain..." (Điều này gây mưa axit - hệ quả của ô nhiễm không khí).</p>

            `

        },

        {

            id: 41,

            type: "matching",

            question: "Question 39",

            context: `(See passage above)`,

            options: [

                "A. Air pollution, soil pollution, water pollution and noise pollution.",

                "B. This can cause acid rain which damages water, soil and plants",

                "C. Not only for the sake of the environment, but also for the people that live in it.",

                "D. Which makes the water unclean or contaminated."

            ],

            answer: 3, // D matches blank 39

            explanation: `

                <span class="exp-title">Ghép câu:</span>

                <p>Câu nói về Water pollution... dumping chemicals in rivers...</p>

                <p>=> Cần một mệnh đề quan hệ giải thích hậu quả.</p>

                <p>=> Đáp án D: "Which makes the water unclean..." (Điều làm cho nước bị bẩn hoặc ô nhiễm).</p>

            `

        },

        {

            id: 42,

            type: "matching",

            question: "Question 40",

            context: `(See passage above)`,

            options: [

                "A. Air pollution, soil pollution, water pollution and noise pollution.",

                "B. This can cause acid rain which damages water, soil and plants",

                "C. Not only for the sake of the environment, but also for the people that live in it.",

                "D. Which makes the water unclean or contaminated."

            ],

            answer: 2, // C matches blank 40

            explanation: `

                <span class="exp-title">Ghép câu:</span>

                <p>Kết bài: Cần giải quyết vấn đề sớm nhất có thể...</p>

                <p>=> Đáp án C: "Not only for... but also..." (Không chỉ vì môi trường mà còn vì con người sống trong đó). Đây là câu kết ý nghĩa.</p>

            `

        }

    ]
  }

];
