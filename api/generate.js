<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>McDonald's Job Application</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Courier+Prime:wght@400;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier Prime', monospace;
            background: linear-gradient(135deg, #FFC72C 0%, #DA291C 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            margin-bottom: 40px;
            color: white;
            text-shadow: 3px 3px 0px rgba(0,0,0,0.3);
        }

        h1 {
            font-family: 'Bangers', cursive;
            font-size: 4rem;
            letter-spacing: 3px;
            margin-bottom: 10px;
            color: #FFC72C;
            -webkit-text-stroke: 2px #DA291C;
        }

        .tagline {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
        }

        .input-section {
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-bottom: 40px;
            border: 4px solid #DA291C;
        }

        .input-group {
            display: flex;
            gap: 10px;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
        }

        input[type="text"] {
            padding: 15px 20px;
            font-size: 1.2rem;
            border: 3px solid #DA291C;
            border-radius: 10px;
            min-width: 300px;
            font-family: 'Courier Prime', monospace;
        }

        button {
            padding: 15px 40px;
            font-size: 1.2rem;
            font-weight: bold;
            background: #DA291C;
            color: white;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-family: 'Bangers', cursive;
            letter-spacing: 1px;
            transition: transform 0.2s;
        }

        button:hover {
            transform: scale(1.05);
            background: #b52318;
        }

        button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: white;
            font-size: 1.5rem;
        }

        .spinner {
            border: 5px solid #FFC72C;
            border-top: 5px solid #DA291C;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .results {
            display: none;
        }

        .results.active {
            display: block;
        }

        .application-wrapper {
            position: relative;
            margin-bottom: 40px;
        }

        .application {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 3px solid #333;
            position: relative;
        }

        .app-header {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #DA291C;
        }

        .pfp {
            width: 120px;
            height: 120px;
            border: 4px solid #DA291C;
            object-fit: cover;
        }

        .user-info h2 {
            font-family: 'Bangers', cursive;
            color: #DA291C;
            font-size: 2rem;
            margin-bottom: 5px;
        }

        .user-info p {
            color: #666;
            font-size: 0.9rem;
        }

        .form-section {
            margin-bottom: 25px;
        }

        .form-section label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #DA291C;
            text-transform: uppercase;
            font-size: 0.9rem;
        }

        .form-section .value {
            padding: 10px;
            background: #f9f9f9;
            border: 2px solid #ddd;
            border-radius: 5px;
            min-height: 40px;
        }

        .stamp {
            position: absolute;
            top: 50%;
            right: 10%;
            transform: translate(0, -50%) rotate(-15deg);
            opacity: 0;
            transition: opacity 0.3s;
        }

        .stamp.show {
            animation: stampSlam 0.6s ease-out forwards;
        }

        @keyframes stampSlam {
            0% {
                opacity: 0;
                transform: translate(0, -200%) rotate(-15deg) scale(0.5);
            }
            70% {
                opacity: 1;
                transform: translate(0, -50%) rotate(-15deg) scale(1.1);
            }
            100% {
                opacity: 1;
                transform: translate(0, -50%) rotate(-15deg) scale(1);
            }
        }

        .stamp-img {
            width: 200px;
            height: 200px;
        }

        .badge-container {
            opacity: 0;
            transition: opacity 0.5s;
            margin-top: 40px;
        }

        .badge-container.show {
            opacity: 1;
        }

        .badge {
            background: linear-gradient(135deg, #DA291C 0%, #b52318 100%);
            padding: 30px;
            border-radius: 15px;
            max-width: 400px;
            margin: 0 auto;
            border: 5px solid #FFC72C;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            text-align: center;
            color: white;
            position: relative;
        }

        .badge::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
        }

        .badge-pfp {
            width: 150px;
            height: 150px;
            border: 5px solid #FFC72C;
            margin: 0 auto 20px;
            display: block;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .badge h3 {
            font-family: 'Bangers', cursive;
            font-size: 2rem;
            margin-bottom: 5px;
            color: #FFC72C;
        }

        .badge .title {
            font-size: 1.2rem;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .badge .employee-id {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 10px;
        }

        .badge .since {
            font-size: 0.8rem;
            opacity: 0.8;
        }

        .action-buttons {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-top: 30px;
            flex-wrap: wrap;
        }

        .action-buttons button {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        @media (max-width: 768px) {
            h1 {
                font-size: 2.5rem;
            }
            
            .tagline {
                font-size: 1rem;
            }

            .app-header {
                flex-direction: column;
                text-align: center;
            }

            input[type="text"] {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🍔 McDONALD'S 🍟</h1>
            <p class="tagline">Leaving the trenches? We're hiring!</p>
        </header>

        <div class="input-section">
            <form id="applicationForm">
                <div class="input-group">
                    <input 
                        type="text" 
                        id="username" 
                        placeholder="Enter Twitter @ (e.g., elonmusk)"
                        required
                    />
                    <button type="submit" id="submitBtn">
                        APPLY NOW
                    </button>
                </div>
            </form>
        </div>

        <div id="loading" class="loading" style="display: none;">
            <div class="spinner"></div>
            <p>Reviewing your qualifications...</p>
        </div>

        <div id="results" class="results">
            <div class="application-wrapper">
                <div id="applicationCard" class="application">
                    <div class="app-header">
                        <img id="appPfp" src="" alt="Profile" class="pfp" />
                        <div class="user-info">
                            <h2 id="appName">Name</h2>
                            <p id="appBio">Bio</p>
                        </div>
                    </div>

                    <div class="form-section">
                        <label>Position Applied For:</label>
                        <div class="value" id="position">Crew Member</div>
                    </div>

                    <div class="form-section">
                        <label>Why do you want to work at McDonald's?</label>
                        <div class="value" id="whyMcdonalds"></div>
                    </div>

                    <div class="form-section">
                        <label>Previous Experience:</label>
                        <div class="value" id="experience"></div>
                    </div>

                    <div class="form-section">
                        <label>Special Skills:</label>
                        <div class="value" id="skills"></div>
                    </div>

                    <div class="form-section">
                        <label>Available to Start:</label>
                        <div class="value" id="startDate">Immediately</div>
                    </div>

                    <div class="form-section">
                        <label>Manager's Additional Comments:</label>
                        <div class="value" id="comments"></div>
                    </div>
                </div>

                <div id="stamp" class="stamp">
                    <svg class="stamp-img" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="100" cy="100" r="90" fill="none" stroke="#DA291C" stroke-width="8" opacity="0.8"/>
                        <circle cx="100" cy="100" r="75" fill="none" stroke="#DA291C" stroke-width="4" opacity="0.6"/>
                        <text x="100" y="95" text-anchor="middle" font-family="Bangers" font-size="35" fill="#DA291C" transform="rotate(-15 100 100)">
                            APPROVED
                        </text>
                        <text x="100" y="120" text-anchor="middle" font-family="Courier Prime" font-size="16" fill="#DA291C" transform="rotate(-15 100 100)">
                            McDONALD'S
                        </text>
                    </svg>
                </div>
            </div>

            <div id="badgeContainer" class="badge-container">
                <div id="badgeCard" class="badge">
                    <img id="badgePfp" src="" alt="Employee" class="badge-pfp" />
                    <h3 id="badgeName">Name</h3>
                    <div class="title">CREW MEMBER</div>
                    <div class="employee-id" id="employeeId">ID: #000000</div>
                    <div class="since" id="since">Member Since 2025</div>
                </div>
            </div>

            <div class="action-buttons">
                <button onclick="downloadApplication()">
                    📥 Download Application
                </button>
                <button onclick="downloadBadge()">
                    📥 Download Badge
                </button>
                <button onclick="shareToTwitter()">
                    🐦 Share to Twitter
                </button>
            </div>
        </div>
    </div>

    <script>
        const form = document.getElementById('applicationForm');
        const loading = document.getElementById('loading');
        const results = document.getElementById('results');
        const submitBtn = document.getElementById('submitBtn');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.replace('@', '').trim();
            if (!username) return;

            // Show loading
            loading.style.display = 'block';
            results.classList.remove('active');
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) throw new Error('Failed to generate application');

                const data = await response.json();
                
                // Crop PFP from screenshot (client-side)
                const croppedPfp = await cropPfpFromScreenshot(data.screenshot);
                
                // Populate application
                document.getElementById('appPfp').src = croppedPfp;
                document.getElementById('appName').textContent = data.name;
                document.getElementById('appBio').textContent = data.bio;
                document.getElementById('position').textContent = data.position;
                document.getElementById('whyMcdonalds').textContent = data.whyMcdonalds;
                document.getElementById('experience').textContent = data.experience;
                document.getElementById('skills').textContent = data.skills;
                document.getElementById('startDate').textContent = data.startDate;
                document.getElementById('comments').textContent = data.comments;

                // Populate badge
                document.getElementById('badgePfp').src = croppedPfp;
                document.getElementById('badgeName').textContent = data.name;
                document.getElementById('employeeId').textContent = `ID: #${data.employeeId}`;
                document.getElementById('since').textContent = `Member Since ${new Date().getFullYear()}`;

                // Show results
                loading.style.display = 'none';
                results.classList.add('active');

                // Animate stamp
                setTimeout(() => {
                    document.getElementById('stamp').classList.add('show');
                }, 500);

                // Show badge
                setTimeout(() => {
                    document.getElementById('badgeContainer').classList.add('show');
                }, 1500);

            } catch (error) {
                console.error('Error:', error);
                alert('Failed to generate application. Please try again.');
                loading.style.display = 'none';
            } finally {
                submitBtn.disabled = false;
            }
        });

        async function downloadApplication() {
            const element = document.getElementById('applicationCard');
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: '#ffffff'
            });
            
            const link = document.createElement('a');
            link.download = 'mcdonalds-application.png';
            link.href = canvas.toDataURL();
            link.click();
        }

        async function downloadBadge() {
            const element = document.getElementById('badgeCard');
            const canvas = await html2canvas(element, {
                scale: 2,
                backgroundColor: null
            });
            
            const link = document.createElement('a');
            link.download = 'mcdonalds-badge.png';
            link.href = canvas.toDataURL();
            link.click();
        }

        function shareToTwitter() {
            const text = encodeURIComponent("I'm leaving the trenches and working for mcdonalds.fun - generate yours today!");
            const url = encodeURIComponent('https://mcdonalds.fun');
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        }

        // Crop PFP from Twitter screenshot
        async function cropPfpFromScreenshot(screenshotBase64) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Twitter PFP coordinates (adjust these if needed)
                    const cropX = 48;
                    const cropY = 48;
                    const cropWidth = 133;
                    const cropHeight = 133;
                    
                    canvas.width = cropWidth;
                    canvas.height = cropHeight;
                    
                    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
                    
                    resolve(canvas.toDataURL('image/png'));
                };
                img.src = screenshotBase64;
            });
        }
    </script>
</body>
</html>
