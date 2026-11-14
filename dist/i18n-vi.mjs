// VIETNAMESE COPY — edit the values on the right, then save this UTF-8 file.
// The English comment and key identify the text used by the game. Keep keys unchanged.
// Preserve {name}, {count}, and other placeholders exactly; they are filled at runtime.
// Game names and player names are intentionally preserved. See TRANSLATIONS.md.

// MENUS, BUTTONS, MESSAGES, ACCESSIBLE LABELS
export const MESSAGES = Object.freeze({
  // English: Preview birthday cake
  "Preview birthday cake": "Xem thử bánh sinh nhật",
  // English: No stars needed for this preview.
  "No stars needed for this preview.": "Xem thử ngay, không cần đủ sao.",
  // English: Birthday preview
  "Birthday preview": "Xem thử sinh nhật",
  // English: Camera / photo
  "Camera / photo": "Camera / ảnh",
  // English: Camera off.
  "Camera off.": "Camera đang tắt.",
  // English: Arcade
  "Arcade": "Khu trò chơi",
  // English: Wardrobe
  "Wardrobe": "Tủ đồ",
  // English: Arcade navigation
  "Arcade navigation": "Điều hướng khu trò chơi",
  // English: coins
  "coins": "xu",
  // English: Stars
  "Stars": "Sao",
  // English: Fish
  "Fish": "Cá",
  // English: Gates
  "Gates": "Cổng",
  // English: Points
  "Points": "Điểm",
  // English: Score
  "Score": "Điểm số",
  // English: Lines
  "Lines": "Hàng",
  // English: Level
  "Level": "Cấp độ",
  // English: Course
  "Course": "Chặng đường",
  // English: Hearts
  "Hearts": "Tim",
  // English: Energy
  "Energy": "Năng lượng",
  // English: Best
  "Best": "Kỷ lục",
  // English: Best score
  "Best score": "Điểm cao nhất",
  // English: Best lines
  "Best lines": "Kỷ lục số hàng",
  // English: Next
  "Next": "Tiếp theo",
  // English: Next piece
  "Next piece": "Khối tiếp theo",
  // English: Next star
  "Next star": "Sao tiếp theo",
  // English: Round goal
  "Round goal": "Mục tiêu lượt chơi",
  // English: All stars collected
  "All stars collected": "Đã nhận đủ sao",
  // English: All rewards collected
  "All rewards collected": "Đã nhận đủ phần thưởng",
  // English: Collected ✓
  "Collected ✓": "Đã nhận ✓",
  // English: collected
  "collected": "đã nhận",
  // English: not collected
  "not collected": "chưa nhận",
  // English: star collected
  "star collected": "đã nhận sao",
  // English: star not yet collected
  "star not yet collected": "chưa nhận sao",
  // English: Ready to play
  "Ready to play": "Sẵn sàng chơi",
  // English: Play
  "Play": "Chơi",
  // English: Pause
  "Pause": "Tạm dừng",
  // English: Pause game
  "Pause game": "Tạm dừng trò chơi",
  // English: How to play
  "How to play": "Cách chơi",
  // English: Music
  "Music": "Nhạc",
  // English: Mute sound effects
  "Mute sound effects": "Tắt hiệu ứng âm thanh",
  // English: Enable sound effects
  "Enable sound effects": "Bật hiệu ứng âm thanh",
  // English: Back to arcade
  "Back to arcade": "Về khu trò chơi",
  // English: Back to the arcade
  "Back to the arcade": "Về khu trò chơi",
  // English: Back to the arcade →
  "Back to the arcade →": "Về khu trò chơi →",
  // English: ← Back to the arcade
  "← Back to the arcade": "← Về khu trò chơi",
  // English: Back to the game
  "Back to the game": "Về trò chơi",
  // English: Back to the garden
  "Back to the garden": "Về khu vườn",
  // English: Play again
  "Play again": "Chơi lại",
  // English: Try again
  "Try again": "Thử lại",
  // English: Fly again
  "Fly again": "Bay lần nữa",
  // English: Run again
  "Run again": "Chạy lần nữa",
  // English: Start a fresh run
  "Start a fresh run": "Chơi lại từ đầu",
  // English: Start a fresh flight
  "Start a fresh flight": "Bay lại từ đầu",
  // English: Start a fresh round
  "Start a fresh round": "Chơi lại từ đầu",
  // English: Move
  "Move": "Di chuyển",
  // English: Turn
  "Turn": "Xoay",
  // English: Drop
  "Drop": "Thả ngay",
  // English: Soft
  "Soft": "Rơi nhanh",
  // English: Cast
  "Cast": "Thả câu",
  // English: Flap
  "Flap": "Vỗ cánh",
  // English: Jump
  "Jump": "Nhảy",
  // English: Shoot
  "Shoot": "Bắn",
  // English: arrow keys
  "arrow keys": "các phím mũi tên",
  // English: arrow keys or WASD
  "arrow keys or WASD": "các phím mũi tên hoặc WASD",
  // English: Your cat
  "Your cat": "Mèo của bạn",
  // English: Your name
  "Your name": "Tên của bạn",
  // English: Enter your name
  "Enter your name": "Nhập tên của bạn",
  // English: What should we call you?
  "What should we call you?": "Bạn tên là gì nhỉ?",
  // English: Please enter a name.
  "Please enter a name.": "Vui lòng nhập tên.",
  // English: Please enter your name.
  "Please enter your name.": "Vui lòng nhập tên của bạn.",
  // English: Enter the arcade
  "Enter the arcade": "Vào khu trò chơi",
  // English: Continue to the arcade →
  "Continue to the arcade →": "Tiếp tục vào khu trò chơi →",
  // English: Save name
  "Save name": "Lưu tên",
  // English: Set your name
  "Set your name": "Nhập tên của bạn",
  // English: Edit player name
  "Edit player name": "Đổi tên người chơi",
  // English: Close player profile
  "Close player profile": "Đóng hồ sơ người chơi",
  // English: Your birthday arcade.
  "Your birthday arcade.": "Góc vui chơi sinh nhật.",
  // English: Choose a game
  "Choose a game": "Chọn trò chơi",
  // English: / 6 games completed
  "/ 6 games completed": "/ 6 trò chơi đã hoàn thành",
  // English: / 7 outfits owned
  "/ 7 outfits owned": "/ 7 trang phục đã sở hữu",
  // English: Birthday stars
  "Birthday stars": "Sao sinh nhật",
  // English: Birthday star count
  "Birthday star count": "Số sao sinh nhật",
  // English: Birthday star progress
  "Birthday star progress": "Tiến độ thu thập sao sinh nhật",
  // English: Twenty birthday stars
  "Twenty birthday stars": "Hai mươi sao sinh nhật",
  // English: Cat check
  "Cat check": "Xác minh mèo của bạn",
  // English: All six games
  "All six games": "Hoàn thành 6 trò",
  // English: A birthday surprise
  "A birthday surprise": "Bất ngờ ngày sinh nhật",
  // English: Collect 20 stars to unwrap it.
  "Collect 20 stars to unwrap it.": "Nhận đủ 20 sao để mở quà nhé :3",
  // English: Your cake is ready. Make a wish.
  "Your cake is ready. Make a wish.": "Bánh sinh nhật đã sẵn sàng. Hãy ước điều ước sinh nhật!",
  // English: Celebrate!
  "Celebrate!": "Mừng sinh nhật!",
  // English: Celebrate your twentieth birthday
  "Celebrate your twentieth birthday": "Mừng sinh nhật tuổi hai mươi",
  // English: Progress saved on this device
  "Progress saved on this device": "Tiến độ đã lưu trên thiết bị này",
  // English: Saving unavailable · keep this tab open
  "Saving unavailable · keep this tab open": "Không thể lưu · hãy giữ tab này mở",
  // English: Saving unavailable. Rewards stay in this tab until you leave.
  "Saving unavailable. Rewards stay in this tab until you leave.": "Không thể lưu. Phần thưởng chỉ được giữ trong tab này đến khi bạn rời đi.",
  // English: Saving unavailable. Progress may be lost when you leave this page.
  "Saving unavailable. Progress may be lost when you leave this page.": "Không thể lưu. Tiến độ có thể mất khi bạn rời trang này.",
  // English: Available coins
  "Available coins": "Số xu hiện có",
  // English: View coin collection
  "View coin collection": "Xem số xu đã nhận",
  // English: View collected rewards
  "View collected rewards": "Xem phần thưởng đã nhận",
  // English: View your collected rewards
  "View your collected rewards": "Xem phần thưởng đã nhận",
  // English: Coins collected
  "Coins collected": "Xu đã nhận",
  // English: Your stars
  "Your stars": "Sao của bạn",
  // English: Close coin collection
  "Close coin collection": "Đóng cửa sổ xu",
  // English: Close collection
  "Close collection": "Đóng bộ sưu tập",
  // English: Close instructions
  "Close instructions": "Đóng hướng dẫn",
  // English: Each star brings 10 coins, just once.
  "Each star brings 10 coins, just once.": "Mỗi sao tặng 10 xu, chỉ một lần duy nhất.",
  // English: All rewards collected. Play for the joy.
  "All rewards collected. Play for the joy.": "Đã nhận đủ phần thưởng. Chơi vui vẻ nhé.",
  // English: Costume shop
  "Costume shop": "Cửa hàng trang phục",
  // English: Cat breed
  "Cat breed": "Giống mèo",
  // English: Always free
  "Always free": "Miễn phí",
  // English: Choose a free cat breed
  "Choose a free cat breed": "Chọn giống mèo (miễn phí)",
  // English: FITTING ROOM
  "FITTING ROOM": "PHÒNG THỬ ĐỒ",
  // English: Preview an outfit
  "Preview an outfit": "Thử trang phục",
  // English: Original
  "Original": "Mặc định",
  // English: Original costume
  "Original costume": "Trang phục mặc định",
  // English: Garden Paws
  "Garden Paws": "Mèo làm vườn",
  // English: Little Sailor
  "Little Sailor": "Thủy thủ nhỏ",
  // English: Bumble Cat
  "Bumble Cat": "Mèo ong",
  // English: Moon Wizard
  "Moon Wizard": "Phù thủy mặt trăng",
  // English: Space Mochi
  "Space Mochi": "Phi hành gia mều",
  // English: Birthday Cat
  "Birthday Cat": "Mèo sinh nhật",
  // English: British Shorthair
  "British Shorthair": "Anh lông ngắn",
  // English: Siamese
  "Siamese": "Mèo Xiêm",
  // English: Orange
  "Orange": "Mèo cam",
  // English: Ragdoll
  "Ragdoll": "Ragdoll",
  // English: Equipped ✓
  "Equipped ✓": "Đang mặc ✓",
  // English: Owned
  "Owned": "Đã sở hữu",
  // English: Saving…
  "Saving…": "Đang lưu…",
  // English: Equip outfit
  "Equip outfit": "Mặc trang phục",
  // English: Try original costume
  "Try original costume": "Thử trang phục mặc định",
  // English: costume shop ↗
  "costume shop ↗": "cửa hàng trang phục ↗",
  // English: Visit the costume shop ↗
  "Visit the costume shop ↗": "Ghé cửa hàng trang phục ↗",
  // English: Little paws. A bigger screen.
  "Little paws. A bigger screen.": "Mở màn hình lớn để chơi!",
  // English: Use a browser window at least 1,000 pixels wide.
  "Use a browser window at least 1,000 pixels wide.": "Dùng cửa sổ trình duyệt rộng ít nhất 1.000 pixel.",
  // English: This chapter needs a browser window at least 1,000 pixels wide.
  "This chapter needs a browser window at least 1,000 pixels wide.": "Trò chơi cần cửa sổ trình duyệt rộng ít nhất 1.000 pixel.",
  // English: Open the arcade on a laptop or desktop.
  "Open the arcade on a laptop or desktop.": "Mở khu trò chơi trên máy tính xách tay hoặc máy tính bàn.",
  // English: Open the arcade on a laptop or desktop with a keyboard.
  "Open the arcade on a laptop or desktop with a keyboard.": "Mở khu trò chơi trên máy tính có bàn phím.",
  // English: Open the wardrobe on a laptop or desktop.
  "Open the wardrobe on a laptop or desktop.": "Mở tủ đồ trên máy tính xách tay hoặc máy tính bàn.",
  // English: Open your birthday surprise on a laptop or desktop.
  "Open your birthday surprise on a laptop or desktop.": "Mở bất ngờ sinh nhật trên máy tính xách tay hoặc máy tính bàn.",
  // English: Your camera preview
  "Your camera preview": "Hình ảnh từ camera của bạn",
  // English: Your selected cat photo
  "Your selected cat photo": "Ảnh mèo bạn đã chọn",
  // English: Exit camera
  "Exit camera": "Tắt camera",
  // English: Exit camera mode
  "Exit camera mode": "Tắt chế độ camera",
  // English: Start preview ▷
  "Start preview ▷": "Hiển thị camera ▷",
  // English: ✓ Cat approved
  "✓ Cat approved": "✓ Đã xác minh mèo thành công",
  // English: Cat detection progress
  "Cat detection progress": "Tiến độ nhận diện mèo",
  // English: CAT CHECK
  "CAT CHECK": "XÁC MINH MÈO CỦA BẠN",
  // English: Turn on camera
  "Turn on camera": "Bật camera",
  // English: Cat spotted. Hold still for a moment…
  "Cat spotted. Hold still for a moment…": "Thấy mèo rồi. Giữ yên một chút nhé…",
  // English: The cat detector couldn’t read the camera. Try again, or choose a cat photo.
  "The cat detector couldn’t read the camera. Try again, or choose a cat photo.": "Bộ nhận diện chưa đọc được camera. Thử lại hoặc chọn ảnh mèo.",
  // English: Ready when you are.
  "Ready when you are.": "Khi nào sẵn sàng, mình bắt đầu nhé.",
  // English: The cat detector couldn’t load. Check your connection, or choose a cat photo.
  "The cat detector couldn’t load. Check your connection, or choose a cat photo.": "Chưa tải được bộ nhận diện mèo. Kiểm tra kết nối hoặc chọn ảnh mèo.",
  // English: Camera access was allowed, but the preview couldn’t start. Try again, or choose a cat photo.
  "Camera access was allowed, but the preview couldn’t start. Try again, or choose a cat photo.": "Camera đã được cho phép nhưng chưa mở được hình ảnh. Thử lại hoặc chọn ảnh mèo.",
  // English: Your check-in is still waiting.
  "Your check-in is still waiting.": "Bạn vẫn cần xác minh mèo để vào chơi.",
  // English: Camera allowed. Tap Start preview to continue.
  "Camera allowed. Tap Start preview to continue.": "Đã cấp quyền camera. Nhấn “Hiển thị camera” để tiếp tục.",
  // English: Your browser needs one more click to show the camera.
  "Your browser needs one more click to show the camera.": "Nhấn thêm một lần để trình duyệt hiển thị hình ảnh từ camera.",
  // English: Camera ready. Loading the cat detector…
  "Camera ready. Loading the cat detector…": "Camera sẵn sàng. Đang tải bộ nhận diện mèo…",
  // English: Allow your camera when the browser asks.
  "Allow your camera when the browser asks.": "Cho phép dùng camera khi trình duyệt hỏi.",
  // English: Choose a JPG, PNG, or WebP photo smaller than 15 MB.
  "Choose a JPG, PNG, or WebP photo smaller than 15 MB.": "Chọn ảnh JPG, PNG hoặc WebP nhỏ hơn 15 MB.",
  // English: Looking for a cat in your photo…
  "Looking for a cat in your photo…": "Đang tìm mèo trong ảnh của bạn…",
  // English: No cat spotted yet. Try a clearer photo, or use your camera.
  "No cat spotted yet. Try a clearer photo, or use your camera.": "Chưa thấy mèo. Thử ảnh rõ hơn hoặc dùng camera.",
  // English: We couldn’t check that photo. Try a different image, or check your connection.
  "We couldn’t check that photo. Try a different image, or check your connection.": "Chưa kiểm tra được ảnh này. Thử ảnh khác hoặc kiểm tra kết nối.",
  // English: Your welcome star is still waiting.
  "Your welcome star is still waiting.": "Sao chào mừng vẫn đang chờ bạn.",
  // English: Let’s meet your cat first.
  "Let’s meet your cat first.": "Cho mình gặp mèo của bạn trước nhé.",
  // English: We couldn’t save your check-in. Allow browser storage, then try again. Your cat is already approved.
  "We couldn’t save your check-in. Allow browser storage, then try again. Your cat is already approved.": "Chưa lưu được lượt xác minh. Hãy cho phép trình duyệt lưu dữ liệu rồi thử lại. Mèo đã được xác minh rồi.",
  // English: Allow browser session storage, then continue. Your cat is already approved.
  "Allow browser session storage, then continue. Your cat is already approved.": "Cho phép lưu dữ liệu phiên trong trình duyệt rồi tiếp tục. Mèo đã được xác minh.",
  // English: Camera paused. Turn it on when you’re ready.
  "Camera paused. Turn it on when you’re ready.": "Camera đã tạm dừng. Bật lại khi bạn sẵn sàng.",
  // English: Your device is blocking the camera. Check Windows Settings → Privacy & security → Camera, or choose a cat photo.
  "Your device is blocking the camera. Check Windows Settings → Privacy & security → Camera, or choose a cat photo.": "Thiết bị đang chặn camera. Kiểm tra Cài đặt Windows → Quyền riêng tư & bảo mật → Camera, hoặc chọn ảnh mèo.",
  // English: This browser or device couldn’t open the camera. If you clicked Allow, try the game in Chrome or Edge, or choose a cat photo.
  "This browser or device couldn’t open the camera. If you clicked Allow, try the game in Chrome or Edge, or choose a cat photo.": "Trình duyệt hoặc thiết bị chưa mở được camera. Nếu đã nhấn Cho phép, hãy thử Chrome hoặc Edge, hoặc chọn ảnh mèo.",
  // English: No camera found. You can use a cat photo instead.
  "No camera found. You can use a cat photo instead.": "Không tìm thấy camera. Bạn có thể dùng ảnh mèo thay thế.",
  // English: Your camera may be busy. Close other camera apps and try again, or choose a cat photo.
  "Your camera may be busy. Close other camera apps and try again, or choose a cat photo.": "Camera có thể đang bận. Đóng ứng dụng khác đang dùng camera rồi thử lại, hoặc chọn ảnh mèo.",
  // English: The camera couldn’t start. Try again, or choose a cat photo.
  "The camera couldn’t start. Try again, or choose a cat photo.": "Chưa bật được camera. Thử lại hoặc chọn ảnh mèo.",
  // English: Fly through 30 gates to win.
  "Fly through 30 gates to win.": "Bay qua 30 cổng để thắng.",
  // English: Find secret boxes. Stun, then stomp.
  "Find secret boxes. Stun, then stomp.": "Tìm hộp bí mật, bắn gây choáng rồi nhảy lên mèo đối thủ.",
  // English: Match three. Make a little magic.
  "Match three. Make a little magic.": "Ghép ba viên kẹo cùng màu để ghi điểm.",
  // English: Clear 15 lines to win.
  "Clear 15 lines to win.": "Xóa 15 hàng để thắng.",
  // English: Ready, little cat?
  "Ready, little cat?": "Cùng mèo dạo vườn nào!",
  // English: Ready to fly?
  "Ready to fly?": "Cùng cất cánh nào!",
  // English: Ready for takeoff
  "Ready for takeoff": "Sẵn sàng cất cánh",
  // English: Gone fishing?
  "Gone fishing?": "Đi câu cá nhé?",
  // English: Ready, little explorer?
  "Ready, little explorer?": "Cùng khám phá những mái nhà!",
  // English: Something sweet?
  "Something sweet?": "Cùng ghép kẹo nào!",
  // English: Ready to stack?
  "Ready to stack?": "Thử tài xếp khối nào!",
  // English: Eat fish. Avoid walls and your parade.
  "Eat fish. Avoid walls and your parade.": "Ăn cá để nối dài đoàn mèo. Tránh tường và đừng va vào chính mình.",
  // English: Make a little room for your cat.
  "Make a little room for your cat.": "Xếp gọn các khối, tạo chỗ cho mèo.",
  // English: Reach
  "Reach": "Đạt",
  // English: Press
  "Press": "Nhấn",
  // English: Use
  "Use": "Dùng",
  // English: Earn stars at
  "Earn stars at": "Nhận sao ở mốc",
  // English: 5, 15, and 30 gates
  "5, 15, and 30 gates": "5, 15 và 30 cổng",
  // English: . Each new star gives
  ". Each new star gives": ". Mỗi sao mới tặng",
  // English: to win, including on replays.
  "to win, including on replays.": "để thắng, kể cả khi chơi lại.",
  // English: 5, 15, and 30 points
  "5, 15, and 30 points": "5, 15 và 30 điểm",
  // English: Small · 1 point
  "Small · 1 point": "Nhỏ · 1 điểm",
  // English: Medium · 2 points
  "Medium · 2 points": "Vừa · 2 điểm",
  // English: Big · 3 points
  "Big · 3 points": "Lớn · 3 điểm",
  // English: 2× reel · 10 sec
  "2× reel · 10 sec": "Thu câu ×2 · 10 giây",
  // English: 2× next fish
  "2× next fish": "Cá tiếp theo ×2",
  // English: Freeze · 5 sec
  "Freeze · 5 sec": "Đóng băng · 5 giây",
  // English: Fish and boost guide
  "Fish and boost guide": "Các loại cá và ngọc hỗ trợ",
  // English: Active fishing boosts
  "Active fishing boosts": "Hiệu ứng câu cá đang có",
  // English: SPACE to cast
  "SPACE to cast": "SPACE để thả câu",
  // English: Reach the
  "Reach the": "Đến",
  // English: ? boxes from below
  "? boxes from below": "hộp ? lơ lửng từ phía dưới",
  // English: 50% chance of 3 energy
  "50% chance of 3 energy": "50% cơ hội nhận 3 năng lượng",
  // English: or a
  "or a": "hoặc",
  // English: 5 seconds
  "5 seconds": "5 giây",
  // English: Garden Roof
  "Garden Roof": "Vườn trên mái",
  // English: Lantern Lane
  "Lantern Lane": "Lối đèn lồng",
  // English: Home Stretch
  "Home Stretch": "Chặng cuối",
  // English: To the finish
  "To the finish": "Đến đích",
  // English: Click two treats or drag to swap
  "Click two treats or drag to swap": "Nhấn hai viên kẹo hoặc kéo để đổi chỗ",
  // English: 25 moves, at your own pace.
  "25 moves, at your own pace.": "25 lượt, không giới hạn thời gian.",
  // English: Match 4 or more for a special treat.
  "Match 4 or more for a special treat.": "Ghép từ 4 viên để tạo kẹo đặc biệt.",
  // English: 10 points
  "10 points": "10 điểm",
  // English: 500, 1,200, and 2,000 points
  "500, 1,200, and 2,000 points": "500, 1.200 và 2.000 điểm",
  // English: 4 in a line
  "4 in a line": "4 viên thẳng hàng",
  // English: 5 in a line
  "5 in a line": "5 viên thẳng hàng",
  // English: L or T match
  "L or T match": "Ghép hình L hoặc T",
  // English: Striped treat
  "Striped treat": "Kẹo sọc",
  // English: Wrapped treat
  "Wrapped treat": "Kẹo gói",
  // English: Rainbow treat
  "Rainbow treat": "Kẹo cầu vồng",
  // English: 3 × 3 area
  "3 × 3 area": "3 × 3 ô",
  // English: Enter or Space
  "Enter or Space": "Enter hoặc Space",
  // English: pauses or resumes. Switching tabs pauses automatically.
  "pauses or resumes. Switching tabs pauses automatically.": "tạm dừng hoặc tiếp tục. Chuyển thẻ sẽ tự động tạm dừng.",
  // English: soft drop.
  "soft drop.": "tăng tốc độ rơi.",
  // English: The outline shows where your piece will land.
  "The outline shows where your piece will land.": "Đường viền cho biết vị trí khối sẽ đáp xuống.",
  // English: 5, 10, and 15 lines
  "5, 10, and 15 lines": "5, 10 và 15 hàng",
  // English: moves
  "moves": "lượt",
  // English: A little sweet tooth.
  "A little sweet tooth.": "Mèo mê kẹo ngọt.",
  // English: A tidy little stack.
  "A tidy little stack.": "Mèo chờ bạn xếp thật gọn.",
  // English: A little magic!
  "A little magic!": "Tạo được kẹo đặc biệt rồi!",
  // English: Treat magic!
  "Treat magic!": "Kẹo đặc biệt phát huy tác dụng!",
  // English: Sweet match!
  "Sweet match!": "Ghép được rồi!",
  // English: One neat line!
  "One neat line!": "Gọn một hàng!",
  // English: Double clear!
  "Double clear!": "Xóa hai hàng!",
  // English: Triple clear!
  "Triple clear!": "Xóa ba hàng!",
  // English: Four lines! Purrfect.
  "Four lines! Purrfect.": "Xóa liền bốn hàng, quá đỉnh!",
  // English: Striped treat!
  "Striped treat!": "Kẹo sọc!",
  // English: Rainbow treat!
  "Rainbow treat!": "Kẹo cầu vồng!",
  // English: Wrapped treat!
  "Wrapped treat!": "Kẹo gói!",
  // English: A fresh mix · no move used
  "A fresh mix · no move used": "Trộn lại bảng · không mất lượt",
  // English: Try a match of three · no move used
  "Try a match of three · no move used": "Chọn cặp tạo được bộ ba · không mất lượt",
  // English: Press Space when you’re ready.
  "Press Space when you’re ready.": "Nhấn Space khi bạn sẵn sàng.",
  // English: One very happy cat.
  "One very happy cat.": "Mèo vui max ping!",
  // English: Oops. Tiny detour.
  "Oops. Tiny detour.": "Ối, inovar chạm rồi!",
  // English: Look at you fly!
  "Look at you fly!": "Bạn bay giỏi quá!",
  // English: A tiny detour.
  "A tiny detour.": "Thử lại một lần nữa nhé!",
  // English: A gate caught those little wings.
  "A gate caught those little wings.": "Mèo va vào cột rồi.",
  // English: A little too close to the clouds.
  "A little too close to the clouds.": "Mèo bay đỉnh nóc kịch trần rồi.",
  // English: Home, sweet rooftop.
  "Home, sweet rooftop.": "Về đích an toàn rồi!",
  // English: A brave little run.
  "A brave little run.": "Bạn đã cố gắng rồi!",
  // English: How sweet it is!
  "How sweet it is!": "Ngọt ngào quá đi!",
  // English: A sweet little round.
  "A sweet little round.": "Một lượt chơi vui thật đấy!",
  // English: A purrfect fit!
  "A purrfect fit!": "Hoàn thành xuất sắc!",
  // English: A little too tall.
  "A little too tall.": "Chồng khối kịch trần rồi!",
  // English: ⚑ Checkpoint reached
  "⚑ Checkpoint reached": "⚑ Đã đến mốc hồi sinh",
  // English: −1 heart · back to your checkpoint
  "−1 heart · back to your checkpoint": "−1 tim · trở về mốc hồi sinh",
  // English: +3 rainbow energy
  "+3 rainbow energy": "+3 năng lượng cầu vồng",
  // English: +1 heart
  "+1 heart": "+1 tim",
  // English: Cat cleared!
  "Cat cleared!": "Đã hạ mèo đối thủ!",
  // English: Cat stunned · jump on it!
  "Cat stunned · jump on it!": "Mèo đối thủ đã choáng, nhảy lên nào!",
  // English: ⚡ 2× reel speed · 10 seconds
  "⚡ 2× reel speed · 10 seconds": "⚡ Tốc độ thu câu ×2 · 10 giây",
  // English: ×2 ready for your next fish
  "×2 ready for your next fish": "Cá tiếp theo được nhân đôi điểm",
  // English: ❄ Fish and orbs frozen · 5 seconds
  "❄ Fish and orbs frozen · 5 seconds": "❄ Đóng băng cá và ngọc · 5 giây",
  // English: A LITTLE ADVENTURE AWAITS
  "A LITTLE ADVENTURE AWAITS": "CHUYẾN PHIÊU LƯU NHỎ ĐANG CHỜ",
  // English: A COZY CLASSIC, WITH CATS
  "A COZY CLASSIC, WITH CATS": "TRÒ CHƠI QUEN THUỘC CÙNG MÈO",
  // English: THE FISH GARDEN
  "THE FISH GARDEN": "KHU VƯỜN CÁ",
  // English: A GENTLE START
  "A GENTLE START": "KHỞI ĐẦU NHẸ NHÀNG",
  // English: HAPPY LITTLE PAWS
  "HAPPY LITTLE PAWS": "NHỮNG BƯỚC CHÂN VUI VẺ",
  // English: QUITE THE PARADE
  "QUITE THE PARADE": "NHIỀU MÈO QUÁ!",
  // English: ARROW KEYS / WASD TO WANDER
  "ARROW KEYS / WASD TO WANDER": "PHÍM MŨI TÊN / WASD ĐỂ DI CHUYỂN",
  // English: SPACE / UP TO FLAP
  "SPACE / UP TO FLAP": "SPACE / ↑ ĐỂ VỖ CÁNH",
  // English: SPACE TO CAST
  "SPACE TO CAST": "SPACE ĐỂ THẢ CÂU",
  // English: SPACE TO JUMP
  "SPACE TO JUMP": "SPACE ĐỂ NHẢY",
  // English: SPACE TO RESUME
  "SPACE TO RESUME": "SPACE ĐỂ TIẾP TỤC",
  // English: EARNED STARS & COINS STAY YOURS
  "EARNED STARS & COINS STAY YOURS": "SAO VÀ XU ĐÃ NHẬN LÀ CỦA BẠN",
  // English: PAUSED
  "PAUSED": "TẠM DỪNG",
  // English: VICTORY
  "VICTORY": "CHIẾN THẮNG",
  // English: RUN COMPLETE
  "RUN COMPLETE": "KẾT THÚC LƯỢT",
  // English: 20 / 20 BIRTHDAY STARS
  "20 / 20 BIRTHDAY STARS": "20 / 20 SAO SINH NHẬT",
  // English: Happy 20th birthday.
  "Happy 20th birthday.": "Chúc mừng sinh nhật tuổi 20!",
  // English: Close your eyes. Make a wish.
  "Close your eyes. Make a wish.": "Nhắm mắt lại và ước một điều nhé.",
  // English: Make a wish & blow out the candles
  "Make a wish & blow out the candles": "Ước một điều rồi thổi nến",
  // English: Make a wish & blow out the candles ✧
  "Make a wish & blow out the candles ✧": "Ước một điều rồi thổi nến ✧",
  // English: Make a wish and blow out the candles
  "Make a wish and blow out the candles": "Ước một điều rồi thổi nến",
  // English: Light the birthday candles again
  "Light the birthday candles again": "Thắp lại nến sinh nhật",
  // English: Light the candles again ↺
  "Light the candles again ↺": "Thắp lại nến ↺",
  // English: ♪ Music off
  "♪ Music off": "♪ Nhạc: tắt",
  // English: ♪ Music on
  "♪ Music on": "♪ Nhạc: bật",
  // English: ♪ Play music
  "♪ Play music": "♪ Phát nhạc",
  // English: Music changed for this visit. Browser saving is unavailable.
  "Music changed for this visit. Browser saving is unavailable.": "Nhạc đã đổi cho lượt này. Trình duyệt chưa lưu được lựa chọn.",
  // English: Twenty Birthday Arcade
  "Twenty Birthday Arcade": "Twenty – Khu trò chơi sinh nhật",
  // English: Twenty Birthday Arcade home
  "Twenty Birthday Arcade home": "Trang chủ khu trò chơi sinh nhật Twenty",
  // English: Twenty · Birthday Arcade
  "Twenty · Birthday Arcade": "Twenty · Khu trò chơi sinh nhật",
  // English: Costume Shop · Twenty Birthday Arcade
  "Costume Shop · Twenty Birthday Arcade": "Cửa hàng trang phục · Twenty",
  // English: Cat check-in · Twenty
  "Cat check-in · Twenty": "Xác minh mèo của bạn · Twenty",
  // English: Your twentieth · Twenty
  "Your twentieth · Twenty": "Tuổi hai mươi của bạn · Twenty",
  // English: Cake board. Use arrow keys or W A S D to move. Collect 30 fish to win.
  "Cake board. Use arrow keys or W A S D to move. Collect 30 fish to win.": "Cake. Dùng phím mũi tên hoặc W A S D để di chuyển. Thu thập 30 cá để thắng.",
  // English: Flappy Cat board. Press Space or Up to flap. Fly through 30 gates to win. P or Escape pauses.
  "Flappy Cat board. Press Space or Up to flap. Fly through 30 gates to win. P or Escape pauses.": "Flappy Cat. Nhấn Space hoặc ↑ để vỗ cánh. Bay qua 30 cổng để thắng. P hoặc Escape để tạm dừng.",
  // English: Cat Fishing lake. Press Space to cast the swinging hook. Reach 30 points to win. P or Escape pauses.
  "Cat Fishing lake. Press Space to cast the swinging hook. Reach 30 points to win. P or Escape pauses.": "Cat Fishing. Nhấn Space để thả móc câu. Đạt 30 điểm để thắng. P hoặc Escape để tạm dừng.",
  // English: Rooftop Run course. Left and Right or A and D to move. Space to jump. X to shoot rainbow lasers. P or Escape pauses.
  "Rooftop Run course. Left and Right or A and D to move. Space to jump. X to shoot rainbow lasers. P or Escape pauses.": "Rooftop Run. Dùng ← và → hoặc A và D để di chuyển. Space để nhảy. X bắn tia cầu vồng. P hoặc Escape để tạm dừng.",
  // English: Treat board. Swap neighboring treats to match three.
  "Treat board. Swap neighboring treats to match three.": "Candy Cat. Đổi chỗ các viên cạnh nhau để ghép ba viên.",
  // English: Your cat in the original costume
  "Your cat in the original costume": "Mèo của bạn trong trang phục mặc định",
  // English: Your cat, a cream pixel cat with pink ears
  "Your cat, a cream pixel cat with pink ears": "Mèo của bạn, chú mèo pixel màu kem với đôi tai hồng",
  // English: A birthday cake with lit number twenty candles and two cats
  "A birthday cake with lit number twenty candles and two cats": "Bánh sinh nhật với nến số 20 đang cháy và hai chú mèo",
  // English: A birthday cake with lit number twenty candles and two happy cats
  "A birthday cake with lit number twenty candles and two happy cats": "Bánh sinh nhật với nến số 20 đang cháy và hai chú mèo vui vẻ",
  // English: A birthday cake with blown-out number twenty candles and two happy cats
  "A birthday cake with blown-out number twenty candles and two happy cats": "Bánh sinh nhật với nến số 20 đã tắt và hai chú mèo vui vẻ",
  // English: Coral fish
  "Coral fish": "Cá hồng cam",
  // English: Sage paw
  "Sage paw": "Dấu chân xanh lá",
  // English: Rose heart
  "Rose heart": "Trái tim hồng",
  // English: Blue milk
  "Blue milk": "Hộp sữa xanh",
  // English: Lavender bow
  "Lavender bow": "Nơ tím",
  // English: Honey bell
  "Honey bell": "Chuông vàng",
  // English: coral fish
  "coral fish": "cá hồng cam",
  // English: sage paw
  "sage paw": "dấu chân xanh lá",
  // English: rose heart
  "rose heart": "trái tim hồng",
  // English: blue milk
  "blue milk": "hộp sữa xanh",
  // English: lavender bow
  "lavender bow": "nơ tím",
  // English: honey bell
  "honey bell": "chuông vàng",
  // English: Cat-check welcome star
  "Cat-check welcome star": "Sao chào mừng",
  // English: Complete all six games
  "Complete all six games": "Hoàn thành cả sáu trò chơi",
  // English: Quite the catch!
  "Quite the catch!": "Mẻ cá tuyệt quá!",
  // English: Fish again
  "Fish again": "Câu lần nữa",
  // English: Victory
  "Victory": "Chiến thắng",
  // English: Round complete
  "Round complete": "Kết thúc lượt",
  // English: Run ended
  "Run ended": "Kết thúc lượt",
  // English: Flight ended
  "Flight ended": "Kết thúc chuyến bay",
  // English: Course complete
  "Course complete": "Hoàn thành đường chạy",
  // English: Out of hearts
  "Out of hearts": "Hết tim",
  // English: No new stars this round
  "No new stars this round": "Lượt này chưa có sao mới",
  // English: A star for you!
  "A star for you!": "Tặng bạn một sao!",
  // English: Your little parade got a bit tangled.
  "Your little parade got a bit tangled.": "Đoàn mèo nhỏ hơi rối rồi.",
  // English: you hit a wall
  "you hit a wall": "bạn chạm vào tường",
  // English: you hit your parade
  "you hit your parade": "bạn chạm vào đoàn mèo",
  // English: LITTLE PAWS, KEEP GOING
  "LITTLE PAWS, KEEP GOING": "MÈO NHỎ ƠI, CỐ LÊN NÀO",
  // English: TAKE YOUR TIME
  "TAKE YOUR TIME": "CỨ THONG THẢ NHÉ",
  // English: ANOTHER LITTLE CHANCE?
  "ANOTHER LITTLE CHANCE?": "THỬ LẠI MỘT LẦN NỮA NHÉ?",
  // English: The fish chase has started. Use arrow keys or WASD to move.
  "The fish chase has started. Use arrow keys or WASD to move.": "Cuộc đuổi cá bắt đầu. Dùng phím mũi tên hoặc WASD để di chuyển.",
  // English: Flight started. Press Space or Up to flap. P or Escape pauses.
  "Flight started. Press Space or Up to flap. P or Escape pauses.": "Chuyến bay bắt đầu. Nhấn Space hoặc ↑ để vỗ cánh. P hoặc Escape để tạm dừng.",
  // English: Fishing started. Press Space to cast the swinging hook. P or Escape pauses.
  "Fishing started. Press Space to cast the swinging hook. P or Escape pauses.": "Bắt đầu câu cá. Nhấn Space để thả móc câu. P hoặc Escape để tạm dừng.",
  // English: Rooftop Run started. Left or Right to run. Space to jump. P or Escape pauses.
  "Rooftop Run started. Left or Right to run. Space to jump. P or Escape pauses.": "Rooftop Run bắt đầu. Nhấn ← hoặc → để chạy. Space để nhảy. P hoặc Escape để tạm dừng.",
  // English: Your breed could not be saved. Enable browser storage and try again.
  "Your breed could not be saved. Enable browser storage and try again.": "Chưa lưu được giống mèo. Cho phép trình duyệt lưu dữ liệu rồi thử lại.",
  // English: Your breed could not be saved. Please try again.
  "Your breed could not be saved. Please try again.": "Chưa lưu được giống mèo. Vui lòng thử lại.",
  // English: Your coin balance changed. Collect a few more stars.
  "Your coin balance changed. Collect a few more stars.": "Số xu đã thay đổi. Gom thêm vài sao nữa nhé.",
  // English: Saving is unavailable. No coins were spent. Enable browser storage and try again.
  "Saving is unavailable. No coins were spent. Enable browser storage and try again.": "Chưa thể lưu. Chưa có xu nào bị trừ. Cho phép trình duyệt lưu dữ liệu rồi thử lại.",
  // English: This outfit is unavailable.
  "This outfit is unavailable.": "Trang phục này chưa có sẵn.",
  // English: Choose an owned outfit first.
  "Choose an owned outfit first.": "Chọn một trang phục bạn đã sở hữu.",
  // English: The outfit could not be saved. Please try again.
  "The outfit could not be saved. Please try again.": "Chưa lưu được trang phục. Vui lòng thử lại.",
  // English: Space or ↑
  "Space or ↑": "Space hoặc ↑",
  // English: Space, P, or Escape
  "Space, P, or Escape": "Space, P hoặc Escape",
  // English: Space, ↑, or W
  "Space, ↑, or W": "Space, ↑ hoặc W",
  // English: P or Escape
  "P or Escape": "P hoặc Escape",
  // English: ← / → or A / D
  "← / → or A / D": "← / → hoặc A / D",
  // English: ← / → or A / D:
  "← / → or A / D:": "← / → hoặc A / D:",
  // English: 25 moves
  "25 moves": "25 lượt",
  // English: 5, then 10, then 15 more fish
  "5, then 10, then 15 more fish": "5 cá, rồi 10 cá, rồi 15 cá",
  // English: Each new game star earns 10 coins. Collected stars never pay twice.
  "Each new game star earns 10 coins. Collected stars never pay twice.": "Mỗi sao mới trong trò chơi tặng 10 xu. Sao đã nhận không tặng xu lần nữa.",
  // English: Your coins
  "Your coins": "Xu của bạn",
  // English: Your rewards
  "Your rewards": "Phần thưởng của bạn",
  // English: Got it
  "Got it": "Đã hiểu",
  // English: Choose a breed. Find an outfit.
  "Choose a breed. Find an outfit.": "Chọn giống mèo, thử đồ yêu thích.",
  // English: Ready to play.
  "Ready to play.": "Sẵn sàng chơi!",
  // English: Owned · free to equip.
  "Owned · free to equip.": "Đã sở hữu · thay đồ miễn phí.",
  // English: Buy once. Wear anytime.
  "Buy once. Wear anytime.": "Mua một lần, mặc tùy thích.",
  // English: 10 coins per new star · 180 coins unlock every outfit.
  "10 coins per new star · 180 coins unlock every outfit.": "Mỗi sao mới tặng 10 xu · 180 xu mở khóa toàn bộ trang phục.",
  // English: No costume. Just your cat.
  "No costume. Just your cat.": "Mèo với bộ lông tự nhiên.",
  // English: A leafy hat for garden days.
  "A leafy hat for garden days.": "Mũ lá xinh cho những ngày dạo vườn.",
  // English: A sailor’s hat for the next voyage.
  "A sailor’s hat for the next voyage.": "Mũ thủy thủ, sẵn sàng ra khơi.",
  // English: A bee costume, complete with tiny wings.
  "A bee costume, complete with tiny wings.": "Bộ đồ ong với đôi cánh nhỏ xinh.",
  // English: A moonlit hat and a touch of magic.
  "A moonlit hat and a touch of magic.": "Mũ phù thủy, mang theo phép màu của trăng.",
  // English: A space suit for a curious cat.
  "A space suit for a curious cat.": "Bộ đồ phi hành gia cho mèo mê khám phá.",
  // English: A party hat for your twentieth.
  "A party hat for your twentieth.": "Mũ tiệc xinh, mừng sinh nhật tuổi 20.",
  // English: Bring your cat along.
  "Bring your cat along.": "Cùng mèo vào chơi nhé!",
  // English: Verify with your camera or a cat photo.
  "Verify with your camera or a cat photo.": "Xác minh mèo bằng camera hoặc ảnh.",
  // English: Show a cat to begin.
  "Show a cat to begin.": "Cho mèo xuất hiện trong khung hình để bắt đầu.",
  // English: Keep your cat clearly in view.
  "Keep your cat clearly in view.": "Để mèo xuất hiện rõ trong khung hình.",
  // English: Good lighting helps.
  "Good lighting helps.": "Chọn nơi đủ sáng để dễ nhận diện hơn.",
  // English: Choose a cat photo
  "Choose a cat photo": "Chọn ảnh mèo",
  // English: Your first cat check earns 1 star.
  "Your first cat check earns 1 star.": "Xác minh mèo lần đầu để nhận 1 sao.",
  // English: Welcome star collected ✓
  "Welcome star collected ✓": "Đã nhận sao chào mừng ✓",
  // English: Cat verified!
  "Cat verified!": "Đã xác minh mèo!",
  // English: What’s your name?
  "What’s your name?": "Bạn tên gì?",
  // English: Your name will be your cat’s name too.
  "Your name will be your cat’s name too.": "Tên của bạn cũng là tên của mèo :)",
  // English: Camera and photos are processed on your device.
  "Camera and photos are processed on your device.": "Camera và ảnh chỉ được xử lý trên thiết bị của bạn.",
  // English: Images are never uploaded or saved.
  "Images are never uploaded or saved.": "Ảnh không được tải lên hay lưu lại.",
  // English: Your name is saved. Verify your cat to play.
  "Your name is saved. Verify your cat to play.": "Tên đã được lưu. Xác minh mèo để vào chơi.",
  // English: Cat verified
  "Cat verified": "Đã xác minh mèo",
  // English: Cat verified. You’re ready to play.
  "Cat verified. You’re ready to play.": "Đã xác minh mèo. Cùng vào chơi nào!",
  // English: Looking for a cat… Keep your cat in view.
  "Looking for a cat… Keep your cat in view.": "Đang tìm mèo… Hãy giữ mèo trong khung hình.",
  // English: Camera off. Choose a photo or try again.
  "Camera off. Choose a photo or try again.": "Đã tắt camera. Chọn ảnh hoặc bật lại camera.",
  // English: Collect 30 fish to win.
  "Collect 30 fish to win.": "Ăn đủ 30 cá để thắng.",
  // English: Catch fish to reach 30 points.
  "Catch fish to reach 30 points.": "Câu cá, đạt 30 điểm để thắng.",
  // English: Reach 2,000 points in 25 moves.
  "Reach 2,000 points in 25 moves.": "Đạt 2.000 điểm trong 25 lượt.",
  // English: Find three stars. Reach the finish.
  "Find three stars. Reach the finish.": "Tìm ba sao và về đích.",
  // English: Space or click to cast.
  "Space or click to cast.": "Nhấn Space hoặc nhấp chuột để thả câu.",
  // English: Space or ↑ to flap.
  "Space or ↑ to flap.": "Nhấn Space hoặc ↑ để vỗ cánh.",
  // English: Paused
  "Paused": "Tạm dừng",
  // English: Resume
  "Resume": "Chơi tiếp",
  // English: Continue when you’re ready.
  "Continue when you’re ready.": "Chơi tiếp khi bạn sẵn sàng.",
  // English: Paused while you were away.
  "Paused while you were away.": "Trò chơi đã tạm dừng khi bạn rời trang.",
  // English: No new rewards this round
  "No new rewards this round": "Lượt này chưa có phần thưởng mới",
  // English: An old boot · no points
  "An old boot · no points": "Giày cũ · không có điểm",
  // English: Hearts already full
  "Hearts already full": "Đã đủ tim",
  // English: Need energy · hit a ? box from below
  "Need energy · hit a ? box from below": "Hết năng lượng · húc hộp ? từ bên dưới",
  // English: Out of hearts. Your rewards are saved.
  "Out of hearts. Your rewards are saved.": "Hết tim. Phần thưởng đã nhận vẫn được giữ lại.",
  // English: All three stars collected!
  "All three stars collected!": "Đã nhận đủ ba sao!",
  // English: All 30 gates cleared!
  "All 30 gates cleared!": "Đã vượt qua 30 cổng!",
  // English: 2,000 points. Well played!
  "2,000 points. Well played!": "Đạt 2.000 điểm. Giỏi lắm!",
  // English: Happy birthday! Here’s to everything ahead. ✦
  "Happy birthday! Here’s to everything ahead. ✦": "Chúc mừng sinh nhật! Mong mọi điều tốt đẹp đang chờ bạn phía trước. ✦",
  // English: Your cake is waiting.
  "Your cake is waiting.": "Bánh sinh nhật đang chờ bạn.",
  // English: Collect all 20 stars to make a wish.
  "Collect all 20 stars to make a wish.": "Gom đủ 20 sao để mở bánh sinh nhật.",
  // English: Catris board, ten columns and twenty rows. Left and right move, up rotates, down speeds up the fall, and Space drops instantly.
  "Catris board, ten columns and twenty rows. Left and right move, up rotates, down speeds up the fall, and Space drops instantly.": "Catris gồm 10 cột và 20 hàng. ← và → di chuyển, ↑ xoay, ↓ tăng tốc độ rơi, Space thả ngay.",
  // English: May this year be kind to you.
  "May this year be kind to you.": "Mong tuổi 20 thật dịu dàng với bạn.",
  // English: Take a quiet breath and think of something you truly hope for. This moment is just for you.
  "Take a quiet breath and think of something you truly hope for. This moment is just for you.": "Hít một hơi thật nhẹ, nghĩ về điều bạn thật lòng mong ước. Khoảnh khắc này là dành cho riêng bạn.",
  // English: You don’t need to have everything figured out. Grow at your own pace, make room for small joys, and be gentle with yourself along the way. I’m glad you’re here. Happy birthday.
  "You don’t need to have everything figured out. Grow at your own pace, make room for small joys, and be gentle with yourself along the way. I’m glad you’re here. Happy birthday.": "Không cần vội có hết mọi câu trả lời đâu. Cứ lớn lên theo nhịp của riêng bạn, giữ lại những niềm vui nhỏ và dịu dàng với bản thân nhé. Cảm ơn vì bạn đã ở đây. Chúc mừng sinh nhật!",
});

// DYNAMIC PHRASES — keep the placeholders in both columns.
export const PHRASES = Object.freeze([
  // English: Welcome back, {name}. Show your cat to enter.
  ["Welcome back, {name}. Show your cat to enter.", "Chào {name}! Xác minh mèo của bạn để vào chơi."],
  // English: Welcome back, {name}.
  ["Welcome back, {name}.", "Chào mừng {name} trở lại!"],
  // English: Welcome, {name}. Your arcade is ready.
  ["Welcome, {name}. Your arcade is ready.", "Chào {name}! Cùng vào khu trò chơi nào."],
  // English: Edit {name}'s profile
  ["Edit {name}'s profile", "Chỉnh sửa hồ sơ của {name}"],
  // English: Happy 20th, {name}.
  ["Happy 20th, {name}.", "Mừng sinh nhật tuổi 20, {name}!"],
  // English: {name}, may twenty bring you people who love you as you are, days that feel peaceful, and the courage to follow what matters to you. I hope you feel heard, supported, and loved, even on the days you doubt yourself.
  ["{name}, may twenty bring you people who love you as you are, days that feel peaceful, and the courage to follow what matters to you. I hope you feel heard, supported, and loved, even on the days you doubt yourself.", "{name} ơi, chúc tuổi 20 của bạn có những người thương yêu mình, những ngày bình yên và cả dũng khí để theo đuổi điều bạn mong muốn. Mong bạn luôn được lắng nghe, được là chính mình, và được yêu thương cả trong những lúc chưa thấy mình đủ tốt."],
  // English: {name}, without a costume.
  ["{name}, without a costume.", "{name} với bộ lông tự nhiên."],
  // English: {name} came in for an early landing.
  ["{name} came in for an early landing.", "{name} chạm đất rồi."],
  // English: {name} found the edge of the garden.
  ["{name} found the edge of the garden.", "{name} chạm vào tường rồi."],
  // English: {name} wearing {outfit} · {breed}
  ["{name} wearing {outfit} · {breed}", "{name} mặc {outfit} · {breed}"],
  // English: {name} wearing {outfit}
  ["{name} wearing {outfit}", "{name} mặc {outfit}"],
  // English: {outfit} costume
  ["{outfit} costume", "Trang phục {outfit}"],
  // English: {outfit} · {breed}
  ["{outfit} · {breed}", "{outfit} · {breed}"],
  // English: {breed} breed, free
  ["{breed} breed, free", "Giống {breed}, miễn phí"],
  // English: {breed} selected. All breeds are free.
  ["{breed} selected. All breeds are free.", "Đã chọn {breed}."],
  // English: {outfit} is yours! Equipped for your next adventure.
  ["{outfit} is yours! Equipped for your next adventure.", "Đã mua và mặc {outfit}."],
  // English: {outfit} equipped.
  ["{outfit} equipped.", "Đã mặc {outfit}."],
  // English: Preview {outfit}
  ["Preview {outfit}", "Thử {outfit}"],
  // English: Buy & equip · {count} coins
  ["Buy & equip · {count} coins", "Mua và mặc · {count} xu"],
  // English: Collect {count} more coins to bring this one home.
  ["Collect {count} more coins to bring this one home.", "Cần thêm {count} xu."],
  // English: {count} stars to go.
  ["{count} stars to go.", "Còn {count} sao nữa."],
  // English: {count} birthday stars to go. Your progress is safe in the arcade.
  ["{count} birthday stars to go. Your progress is safe in the arcade.", "Còn {count} sao nữa để mở bánh sinh nhật."],
  // English: {count} birthday star to go. Your progress is safe in the arcade.
  ["{count} birthday star to go. Your progress is safe in the arcade.", "Còn {count} sao nữa để mở bánh sinh nhật."],
  // English: {count} of 3 stars collected
  ["{count} of 3 stars collected", "Đã nhận {count} trên 3 sao"],
  // English: {count} of 3 stars
  ["{count} of 3 stars", "{count} trên 3 sao"],
  // English: {count} of 3 hearts
  ["{count} of 3 hearts", "{count} trên 3 tim"],
  // English: {count} / {target} fish
  ["{count} / {target} fish", "{count} / {target} cá"],
  // English: {count} / {target} gates
  ["{count} / {target} gates", "{count} / {target} cổng"],
  // English: {count} / {target} points
  ["{count} / {target} points", "{count} / {target} điểm"],
  // English: {count} / {target} lines
  ["{count} / {target} lines", "{count} / {target} hàng"],
  // English: {count} fish: {label}
  ["{count} fish: {label}", "{count} cá: {label}"],
  // English: {count} gates: {label}
  ["{count} gates: {label}", "{count} cổng: {label}"],
  // English: {count} points: {label}
  ["{count} points: {label}", "{count} điểm: {label}"],
  // English: {count} lines: {label}
  ["{count} lines: {label}", "{count} hàng: {label}"],
  // English: {section}: star collected
  ["{section}: star collected", "{section}: đã nhận sao"],
  // English: {section}: star not yet collected
  ["{section}: star not yet collected", "{section}: chưa nhận sao"],
  // English: {game}: star {count}: not collected
  ["{game}: star {count}: not collected", "{game}: sao {count}: chưa nhận"],
  // English: {game}: star {count}: collected
  ["{game}: star {count}: collected", "{game}: sao {count}: đã nhận"],
  // English: {game}: star {count}
  ["{game}: star {count}", "{game}: sao {count}"],
  // English: {label} · Meet a cat to earn this star
  ["{label} · Meet a cat to earn this star", "{label} · Gặp một chú mèo để nhận sao này"],
  // English: {label}: not collected
  ["{label}: not collected", "{label}: chưa nhận"],
  // English: {label}: collected
  ["{label}: collected", "{label}: đã nhận"],
  // English: {count} fish
  ["{count} fish", "{count} cá"],
  // English: {count} gates
  ["{count} gates", "{count} cổng"],
  // English: {count} points
  ["{count} points", "{count} điểm"],
  // English: {count} point
  ["{count} point", "{count} điểm"],
  // English: {count} lines
  ["{count} lines", "{count} hàng"],
  // English: {count} line
  ["{count} line", "{count} hàng"],
  // English: {count} coins
  ["{count} coins", "{count} xu"],
  // English: {count} moves
  ["{count} moves", "{count} lượt"],
  // English: +{count} stars
  ["+{count} stars", "+{count} sao"],
  // English: +{count} star
  ["+{count} star", "+{count} sao"],
  // English: +{count} coins
  ["+{count} coins", "+{count} xu"],
  // English: ✦ A star for you! +{count} coins
  ["✦ A star for you! +{count} coins", "✦ Tặng bạn một sao! +{count} xu"],
  // English: ✦ {count} new stars! +{coins} coins
  ["✦ {count} new stars! +{coins} coins", "✦ {count} sao mới! +{coins} xu"],
  // English: ✦ +{count} stars · +{coins} coins
  ["✦ +{count} stars · +{coins} coins", "✦ +{count} sao · +{coins} xu"],
  // English: ✦ +{count} star · +{coins} coins
  ["✦ +{count} star · +{coins} coins", "✦ +{count} sao · +{coins} xu"],
  // English: +{count} points · Double catch!
  ["+{count} points · Double catch!", "+{count} điểm · Đã nhân đôi điểm cá!"],
  // English: +{count} points
  ["+{count} points", "+{count} điểm"],
  // English: Sweet cascade · ×{count}
  ["Sweet cascade · ×{count}", "Ghép liên hoàn · ×{count}"],
  // English: Purrfect combo ×{count}!
  ["Purrfect combo ×{count}!", "Liên hoàn ×{count}!"],
  // English: Purrfect! · {count} lines cleared
  ["Purrfect! · {count} lines cleared", "Quá đỉnh! · Xóa liền {count} hàng"],
  // English: {count} lines cleared
  ["{count} lines cleared", "Đã xóa {count} hàng"],
  // English: {count} line cleared
  ["{count} line cleared", "Đã xóa {count} hàng"],
  // English: {count} lines. A lovely little finish.
  ["{count} lines. A lovely little finish.", "Đã xóa đủ {count} hàng!"],
  // English: {count} lines cleared. Your collected stars stay saved.
  ["{count} lines cleared. Your collected stars stay saved.", "Đã xóa {count} hàng. Sao đã nhận vẫn được lưu."],
  // English: {count} line cleared. Your collected stars stay saved.
  ["{count} line cleared. Your collected stars stay saved.", "Đã xóa {count} hàng. Sao đã nhận vẫn được lưu."],
  // English: {count} points. Your collected stars are safely saved.
  ["{count} points. Your collected stars are safely saved.", "{count} điểm. Sao đã nhận vẫn được giữ lại."],
  // English: 30 points. {count} fish. One happy cat.
  ["30 points. {count} fish. One happy cat.", "Đạt 30 điểm · Câu được {count} cá."],
  // English: {count} / {target} FISH · GARDEN COMPLETE
  ["{count} / {target} FISH · GARDEN COMPLETE", "{count} / {target} CÁ · HOÀN THÀNH KHU VƯỜN"],
  // English: {count} FISH. ONE VERY HAPPY CAT.
  ["{count} FISH. ONE VERY HAPPY CAT.", "{count} CÁ. MÈO VUI MAX PING!"],
  // English: You made it! {count} stars are still waiting.
  ["You made it! {count} stars are still waiting.", "Bạn đến đích rồi! Vẫn còn {count} sao đang chờ."],
  // English: You made it! {count} star is still waiting.
  ["You made it! {count} star is still waiting.", "Bạn đến đích rồi! Vẫn còn {count} sao đang chờ."],
  // English: All {count} fish collected.
  ["All {count} fish collected.", "Đã thu thập đủ {count} cá."],
  // English: {count} fish collected.
  ["{count} fish collected.", "Đã thu thập {count} cá."],
  // English: {reason} {count} gates passed.
  ["{reason} {count} gates passed.", "{reason} Đã qua {count} cổng."],
  // English: {reason} {count} gate passed.
  ["{reason} {count} gate passed.", "{reason} Đã qua {count} cổng."],
  // English: ⚡ 2× reel · {count}s
  ["⚡ 2× reel · {count}s", "⚡ Thu câu ×2 · {count} giây"],
  // English: ×2 · {count} fish
  ["×2 · {count} fish", "×2 · còn {count} lượt"],
  // English: ❄ Freeze · {count}s
  ["❄ Freeze · {count}s", "❄ Đóng băng · {count} giây"],
  // English: {game} · Twenty Birthday Arcade
  ["{game} · Twenty Birthday Arcade", "{game} · Khu trò chơi sinh nhật Twenty"],
  // English: Open {game} on a laptop or desktop with a keyboard.
  ["Open {game} on a laptop or desktop with a keyboard.", "Mở {game} trên máy tính có bàn phím."],
  // English: Open {game} on a laptop or desktop.
  ["Open {game} on a laptop or desktop.", "Mở {game} trên máy tính xách tay hoặc máy tính bàn."],
  // English: Play {game}
  ["Play {game}", "Chơi {game}"],
  // English: {game} game
  ["{game} game", "Trò chơi {game}"],
  // English: {game} stars
  ["{game} stars", "Sao {game}"],
  // English: {game} pixel art
  ["{game} pixel art", "Hình pixel {game}"],
  // English: Row striped {treat}
  ["Row striped {treat}", "Kẹo {treat} sọc ngang"],
  // English: Column striped {treat}
  ["Column striped {treat}", "Kẹo {treat} sọc dọc"],
  // English: Wrapped {treat}
  ["Wrapped {treat}", "Kẹo {treat} dạng gói"],
  // English: {treat}, row {row}, column {column}
  ["{treat}, row {row}, column {column}", "{treat}, hàng {row}, cột {column}"],
  // English: Next piece: {shape}
  ["Next piece: {shape}", "Khối tiếp theo: {shape}"],
  // English: Catris board, {count} of 15 lines cleared. Current piece {shape}. Left and right move, up rotates, down soft drops, and Space hard drops. P pauses.
  ["Catris board, {count} of 15 lines cleared. Current piece {shape}. Left and right move, up rotates, down soft drops, and Space hard drops. P pauses.", "Catris, đã xóa {count} trên 15 hàng. Khối hiện tại {shape}. ← và → di chuyển, ↑ xoay, ↓ tăng tốc độ rơi, Space thả ngay. P tạm dừng."],
  // English: Catris board, {count} of 15 lines cleared. Left and right move, up rotates, down soft drops, and Space hard drops. P pauses.
  ["Catris board, {count} of 15 lines cleared. Left and right move, up rotates, down soft drops, and Space hard drops. P pauses.", "Catris, đã xóa {count} trên 15 hàng. ← và → di chuyển, ↑ xoay, ↓ tăng tốc độ rơi, Space thả ngay. P tạm dừng."],
  // English: Candy Cat started. {count} moves. Swap neighboring treats to match three.
  ["Candy Cat started. {count} moves. Swap neighboring treats to match three.", "Candy Cat bắt đầu. {count} lượt. Đổi chỗ các viên kẹo cạnh nhau để ghép ba viên."],
  // English: Catris started. Clear {count} lines. Arrow keys move and turn; Space hard drops.
  ["Catris started. Clear {count} lines. Arrow keys move and turn; Space hard drops.", "Catris bắt đầu. Xóa {count} hàng. Phím mũi tên di chuyển và xoay; Space thả ngay."],
  // English: {result}. {count} points. {stars} new stars and {coins} coins.
  ["{result}. {count} points. {stars} new stars and {coins} coins.", "{result}. {count} điểm. {stars} sao mới và {coins} xu."],
  // English: {result}. {count} gates. {stars} new stars and {coins} coins.
  ["{result}. {count} gates. {stars} new stars and {coins} coins.", "{result}. {count} cổng. {stars} sao mới và {coins} xu."],
  // English: {result}. {count} lines, {stars} new stars and {coins} coins.
  ["{result}. {count} lines, {stars} new stars and {coins} coins.", "{result}. {count} hàng, {stars} sao mới và {coins} xu."],
  // English: {result}. {stars} new stars and {coins} coins.
  ["{result}. {stars} new stars and {coins} coins.", "{result}. {stars} sao mới và {coins} xu."],
  // English: Victory! {count} fish collected. {stars} new stars and {coins} coins earned.
  ["Victory! {count} fish collected. {stars} new stars and {coins} coins earned.", "Chiến thắng! Thu thập {count} cá. Nhận {stars} sao mới và {coins} xu."],
  // English: Run ended: {reason}. {count} fish. {stars} new stars, {coins} coins.
  ["Run ended: {reason}. {count} fish. {stars} new stars, {coins} coins.", "Kết thúc lượt: {reason}. {count} cá. {stars} sao mới, {coins} xu."],
  // English: {count} gates. New star! {coins} coins.
  ["{count} gates. New star! {coins} coins.", "{count} cổng. Sao mới! {coins} xu."],
]);
