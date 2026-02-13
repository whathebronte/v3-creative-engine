// Firebase SDK imports
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        import { firebaseConfig, GEMINI_API_KEY, APP_ID } from "./config.js";

        // --- DOM Elements ---
        const dropZone = document.getElementById('file-drop-zone');
        const fileInput = document.getElementById('file-upload');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const errorDiv = document.getElementById('error-message');
        const uploadText = document.getElementById('upload-text');
        const fileNameDisplay = document.getElementById('file-name-display');
        const resultContainer = document.getElementById('result-container');
        const placeholderResult = document.getElementById('placeholder-result');
        const actionButtons = document.getElementById('action-buttons');
        const downloadBtn = document.getElementById('downloadBtn');
        const newAnalysisBtn = document.getElementById('newAnalysisBtn');
        const aiOutputSection = document.getElementById('ai-output-section');
        const aiOutputTitle = document.getElementById('ai-output-title');
        const aiOutputContent = document.getElementById('ai-output-content');
        const aiOutputLoader = document.getElementById('ai-output-loader');
        const closeAiOutputBtn = document.getElementById('closeAiOutputBtn');
        const deepDiveModal = document.getElementById('deep-dive-modal');
        const deepDiveTitle = document.getElementById('deep-dive-title');
        const deepDiveContent = document.getElementById('deep-dive-content');
        const deepDiveLoader = document.getElementById('deep-dive-loader');
        const closeDeepDiveModalBtn = document.getElementById('close-deep-dive-modal');
        const tabsNav = document.getElementById('tabs-nav');
        const backBtn = document.getElementById('backBtn');
        const googleSheetUrlInput = document.getElementById('google-sheet-url');
        const loadSheetBtn = document.getElementById('load-sheet-btn');
        /* const countrySelect = document.getElementById('country-select'); */ // Removed this element
        const repositorySection = document.getElementById('repository-section');
        const repositoryTabsNav = document.getElementById('repository-tabs-nav');
        const repositoryTabsContainer = document.getElementById('repository-tabs-container');
        const mappingModal = document.getElementById('column-mapping-modal');
        const mappingModalTitle = document.getElementById('mapping-modal-title');
        const mappingModalDescription = document.getElementById('mapping-modal-description');
        const mappingContainer = document.getElementById('mapping-container');
        const confirmMappingBtn = document.getElementById('confirm-mapping-btn');
        const cancelMappingBtn = document.getElementById('cancel-mapping-btn');
        const benchmarkTableContainer = document.getElementById('benchmark-table-container');
        const updateBenchmarksBtn = document.getElementById('update-benchmarks-btn');
        const benchmarkFileInput = document.getElementById('benchmark-file-upload');
        const loadingOverlay = document.getElementById('loading-overlay');
        const authContainer = document.getElementById('auth-container');
        const infoModal = document.getElementById('info-modal');
        const infoModalTitle = document.getElementById('info-modal-title');
        const infoModalContent = document.getElementById('info-modal-content');
        const infoModalCloseBtn = document.getElementById('info-modal-close-btn');
        const confirmModal = document.getElementById('confirm-modal');
        const confirmModalContent = document.getElementById('confirm-modal-content');
        const confirmModalCancelBtn = document.getElementById('confirm-modal-cancel-btn');
        const confirmModalConfirmBtn = document.getElementById('confirm-modal-confirm-btn');
        const pauseDropZone = document.getElementById('pause-file-drop-zone');
        const pauseFileInput = document.getElementById('pause-file-upload');
        const pauseFileNameDisplay = document.getElementById('pause-file-name-display');
        const pauseGoogleSheetUrlInput = document.getElementById('pause-google-sheet-url');
        const loadPauseSheetBtn = document.getElementById('load-pause-sheet-btn');
        const weeklyDataDropZone = document.getElementById('weekly-data-drop-zone');
        const weeklyDataFileInput = document.getElementById('weekly-data-file-upload');
        const weeklyDataFileNameDisplay = document.getElementById('weekly-data-file-name-display');
        const weeklyDataGoogleSheetUrlInput = document.getElementById('weekly-data-google-sheet-url');
        const loadWeeklyDataSheetBtn = document.getElementById('load-weekly-data-sheet-btn');


        // --- State ---
        let app, db, auth;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'animac-app';
        let userId = null;
        let isFirebaseReady = false;
        let unsubscribeRepository = () => {}; // Function to stop the Firestore listener
        let unsubscribePauseReliveRepository = () => {};
        let unsubscribePersistentMemoryRepository = () => {};
        let localDataRepository = {};
        let localPauseReliveRepository = [];
        let localPersistentMemoryRepository = [];
        let selectedDatasetId = null;
        let selectedPauseReliveDatasetId = null;
        let selectedPersistentMemoryDatasetId = null;
        let lastResults = [];
        let campaignsForAnalysis = [];
        let currentConfirmHandler = null;
        let hardcodedBenchmarks = {}; 
        let recommendationOverrides = {};
        let pauseReliveRules = {};
        // Removed showAllActions = false;

        // --- Configuration ---
        const SUMMARY_TAB_SLICES = [
            'Control', 'NoSctControlSlice', 'Seu3LowActiveControlSlice', 'HasSctSeuLowAllCamControlSlice',
            'Seu3MedActiveControlSlice', 'HasSctSeuMedAllCamControlSlice', 'Seu3HighActiveControlSlice',
            'HasSctSeuHighAllCamControlSlice', 'Seu3BroadActiveControlSlice', 'HasSctSeuBroadAllCamControlSlice'
        ];

        // MAPPING FIELDS for Summary Input
        const SUMMARY_INPUT_MAPPING_FIELDS = [
            { key: 'campaign', name: 'Campaign / Experiment Name', description: "The name of the campaign." },
            { key: 'country', name: 'Country', description: "The market (e.g., India, Japan)." },
            { key: 'age', name: 'Age', description: "The demographic group (e.g., 18-24)." },
            { key: 'value_type', name: 'Value Type', description: "Distinguishes between Ratio, CI Lower, etc." },
            { key: 'slice', name: 'Slice', description: "The experiment slice name." },
            { key: 'shorts_dac_sct', name: 'Numeric Value (Shorts DAC-SCT)', description: "The main metric value." },
            { key: 'campaign_start_date', name: 'Campaign Start Date', description: "The start date of the campaign." },
            { key: 'campaign_end_date', name: 'Campaign End Date', description: "The scheduled end date of the campaign." },
            { key: 'rasta_end_date', name: 'Rasta End Date', description: "The end date for the data period." },
            { key: 'stat_sig', name: 'Stat Sig (Optional)', description: "Pre-calculated statistical significance." }
        ];

        // MAPPING FIELDS for Weekly Data 
        const WEEKLY_DATA_MAPPING_FIELDS = [
            { key: 'campaign', name: 'Campaign / Experiment Name', description: "The name of the campaign." },
            { key: 'country', name: 'Country', description: "The market (e.g., India, Japan)." },
            { key: 'age', name: 'Age', description: "The demographic group (e.g., 18-24)." },
            { key: 'value_type', name: 'Value Type', description: "Distinguishes between Ratio, CI Lower, etc." },
            { key: 'slice', name: 'Slice', description: "The experiment slice name." },
            { key: 'shorts_dac_sct', name: 'Numeric Value (Shorts DAC-SCT)', description: "The main metric value." },
            { key: 'campaign_start_date', name: 'Campaign Start Date', description: "The start date of the campaign." },
            { key: 'campaign_end_date', name: 'Campaign End Date', description: "The scheduled end date of the campaign." },
            { key: 'rasta_end_date', name: 'Rasta End Date', description: "The end date for the data period." },
            { key: 'stat_sig', name: 'Stat Sig (Optional)', description: "Pre-calculated statistical significance." },
            // Added back the 'week_column' mapping for Long Format files
            { key: 'week_column', name: 'Week ID (Long Format)', description: "The column containing week identifiers (e.g., 'Week1', 'Week2', etc.). (Required)", isLongFormatId: true }
        ];


        const defaultBenchmarks = {
            "India|Control|18-34": null, "India|NoSctControlSlice|18-34": 13.8, "India|Seu3LowActiveControlSlice|18-34": 24.74, "India|HasSctSeuLowAllCamControlSlice|18-34": 22.23, "India|HasSctSeuLowThreePlusCamControlSlice|18-34": 18.12, "India|NoSctSeuLowTenPlusCamControlSlice|18-34": 0.36, "India|NoSctSeuLowThreePlusCamControlSlice|18-34": 1.08, "India|Seu3MedActiveControlSlice|18-34": 37.1, "India|HasSctSeuMedAllCamControlSlice|18-34": 34.3, "India|HasSctSeuMedThreePlusCamControlSlice|18-34": 30.29, "India|NoSctSeuMedTenPlusCamControlSlice|18-34": 0.45, "India|NoSctSeuMedThreePlusCamControlSlice|18-34": 1.51, "India|Seu3HighActiveControlSlice|18-34": 65.9, "India|HasSctSeuHighAllCamControlSlice|18-34": 62.6, "India|HasSctSeuHighThreePlusCamControlSlice|18-34": 58.7, "India|NoSctSeuHighTenPlusCamControlSlice|18-34": 0.72, "India|NoSctSeuHighThreePlusCamControlSlice|18-34": 2.58, "India|Seu3BroadActiveControlSlice|18-34": 26.33, "India|HasSctSeuBroadAllCamControlSlice|18-34": 23.7, "India|HasSctSeuBroadThreePlusCamControlSlice|18-34": 19.48, "India|NoSctSeuBroadTenPlusCamControlSlice|18-34": 0.31, "India|NoSctSeuBroadThreePlusCamControlSlice|18-34": 0.94, "India|PromoShownControl|18-34": 0, "India|Control|18-24": null, "India|NoSctControlSlice|18-24": 14.18, "India|Seu3LowActiveControlSlice|18-24": 25.1, "India|HasSctSeuLowAllCamControlSlice|18-24": 22.57, "India|HasSctSeuLowThreePlusCamControlSlice|18-24": 18.2, "India|NoSctSeuLowTenPlusCamControlSlice|18-24": 0.36, "India|NoSctSeuLowThreePlusCamControlSlice|18-24": 1.11, "India|Seu3MedActiveControlSlice|18-24": 37.56, "India|HasSctSeuMedAllCamControlSlice|18-24": 34.73, "India|HasSctSeuMedThreePlusCamControlSlice|18-24": 30.34, "India|NoSctSeuMedTenPlusCamControlSlice|18-24": 0.45, "India|NoSctSeuMedThreePlusCamControlSlice|18-24": 1.54, "India|Seu3HighActiveControlSlice|18-24": 66.7, "India|HasSctSeuHighAllCamControlSlice|18-24": 63.35, "India|HasSctSeuHighThreePlusCamControlSlice|18-24": 58.74, "India|NoSctSeuHighTenPlusCamControlSlice|18-24": 0.72, "India|NoSctSeuHighThreePlusCamControlSlice|18-24": 2.61, "India|Seu3BroadActiveControlSlice|18-24": 26.83, "India|HasSctSeuBroadAllCamControlSlice|18-24": 24.16, "India|HasSctSeuBroadThreePlusCamControlSlice|18-24": 19.57, "India|NoSctSeuBroadTenPlusCamControlSlice|18-24": 0.31, "India|NoSctSeuBroadThreePlusCamControlSlice|18-24": 0.97, "India|PromoShownControl|18-24": 0, "India|Control|25-34": null, "India|NoSctControlSlice|25-34": 13.43, "India|Seu3LowActiveControlSlice|25-34": 24.38, "India|HasSctSeuLowAllCamControlSlice|25-34": 21.89,
            "India|NoSctSeuLowTenPlusCamControlSlice|25-34": 0.36, "India|NoSctSeuLowThreePlusCamControlSlice|25-34": 1.05, "India|Seu3MedActiveControlSlice|25-34": 36.65, "India|HasSctSeuMedAllCamControlSlice|25-34": 33.87, "India|HasSctSeuMedThreePlusCamControlSlice|25-34": 30.24, "India|NoSctSeuMedTenPlusCamControlSlice|25-34": 0.45, "India|NoSctSeuMedThreePlusCamControlSlice|25-34": 1.49, "India|Seu3HighActiveControlSlice|25-34": 65.11, "India|HasSctSeuHighAllCamControlSlice|25-34": 61.85, "India|HasSctSeuHighThreePlusCamControlSlice|25-34": 58.67, "India|NoSctSeuHighTenPlusCamControlSlice|25-34": 0.72, "India|NoSctSeuHighThreePlusCamControlSlice|25-34": 2.55, "India|Seu3BroadActiveControlSlice|25-34": 25.84, "India|HasSctSeuBroadAllCamControlSlice|25-34": 23.25, "Indonesia|HasSctSeuBroadThreePlusCamControlSlice|25-34": 18.78, "Indonesia|NoSctSeuBroadTenPlusCamControlSlice|25-34": 0.33, "Indonesia|NoSctSeuBroadThreePlusCamControlSlice|25-34": 0.95, "Indonesia|PromoShownControl|25-34": 0, "Japan|Control|18-34": null, "Japan|NoSctControlSlice|18-34": 13.56, "Japan|Seu3LowActiveControlSlice|18-34": 22.06, "Japan|HasSctSeuLowAllCamControlSlice|18-34": 19.74, "Japan|HasSctSeuLowThreePlusCamControlSlice|18-34": 14.54, "Japan|NoSctSeuLowTenPlusCamControlSlice|18-34": 0.53, "Japan|NoSctSeuLowThreePlusCamControlSlice|18-34": 1.25, "Japan|Seu3MedActiveControlSlice|18-34": 30.65, "Japan|HasSctSeuMedAllCamControlSlice|18-34": 27.91, "Japan|HasSctSeuMedThreePlusCamControlSlice|18-34": 22.04, "Japan|NoSctSeuMedTenPlusCamControlSlice|18-34": 0.65, "Japan|NoSctSeuMedThreePlusCamControlSlice|18-34": 1.83, "Japan|Seu3HighActiveControlSlice|18-34": 46.54, "Japan|HasSctSeuHighAllCamControlSlice|18-34": 43.51, "Japan|HasSctSeuHighThreePlusCamControlSlice|18-34": 37.64, "Japan|NoSctSeuHighTenPlusCamControlSlice|18-34": 0.89, "Japan|NoSctSeuHighThreePlusCamControlSlice|18-34": 2.94, "Japan|Seu3BroadActiveControlSlice|18-34": 20.35, "Japan|HasSctSeuBroadAllCamControlSlice|18-34": 17.96, "Japan|HasSctSeuBroadThreePlusCamControlSlice|18-34": 12.38, "Japan|NoSctSeuBroadTenPlusCamControlSlice|18-34": 0.28, "Japan|NoSctSeuBroadThreePlusCamControlSlice|18-34": 0.8, "Japan|PromoShownControl|18-34": 0, "Japan|Control|18-24": null, "Japan|NoSctControlSlice|18-24": 13.92, "Japan|Seu3LowActiveControlSlice|18-24": 22.56, "Japan|HasSctSeuLowAllCamControlSlice|18-24": 20.2, "Japan|HasSctSeuLowThreePlusCamControlSlice|18-24": 14.59, "Japan|NoSctSeuLowTenPlusCamControlSlice|18-24": 0.53, "Japan|NoSctSeuLowThreePlusCamControlSlice|18-24": 1.28, "Japan|Seu3MedActiveControlSlice|18-24": 31.25, "Japan|HasSctSeuMedAllCamControlSlice|18-24": 28.46, "Japan|HasSctSeuMedThreePlusCamControlSlice|18-24": 22.09, "Japan|NoSctSeuMedTenPlusCamControlSlice|18-24": 0.65, "Japan|NoSctSeuMedThreePlusCamControlSlice|18-24": 1.87, "Japan|Seu3HighActiveControlSlice|18-24": 47.41, "Japan|HasSctSeuHighAllCamControlSlice|18-24": 44.32, "Japan|HasSctSeuHighThreePlusCamControlSlice|18-24": 37.67, "Japan|NoSctSeuHighTenPlusCamControlSlice|18-24": 0.89, "Japan|NoSctSeuHighThreePlusCamControlSlice|18-24": 2.97, "Japan|Seu3BroadActiveControlSlice|18-24": 20.76, "Japan|HasSctSeuBroadAllCamControlSlice|18-24": 18.33, "Japan|HasSctSeuBroadThreePlusCamControlSlice|18-24": 12.43, "Japan|NoSctSeuBroadTenPlusCamControlSlice|18-24": 0.28, "Japan|NoSctSeuBroadThreePlusCamControlSlice|18-24": 0.83, "Japan|PromoShownControl|18-24": 0, "Japan|Control|25-34": null, "Japan|NoSctControlSlice|25-34": 13.2, "Japan|Seu3LowActiveControlSlice|25-34": 21.57, "Japan|HasSctSeuLowAllCamControlSlice|25-34": 19.28, "Japan|HasSctSeuLowThreePlusCamControlSlice|25-34": 14.49, "Japan|NoSctSeuLowTenPlusCamControlSlice|25-34": 0.53, "Japan|NoSctSeuLowThreePlusCamControlSlice|25-34": 1.22, "Japan|Seu3MedActiveControlSlice|25-34": 30.06, "Japan|HasSctSeuMedAllCamControlSlice|25-34": 27.36, "Japan|HasSctSeuMedThreePlusCamControlSlice|25-34": 21.99, "Japan|NoSctSeuMedTenPlusCamControlSlice|25-34": 0.65, "Japan|NoSctSeuMedThreePlusCamControlSlice|25-34": 1.79, "Japan|Seu3HighActiveControlSlice|25-34": 45.68, "Japan|HasSctSeuHighAllCamControlSlice|25-34": 42.7, "Japan|HasSctSeuHighThreePlusCamControlSlice|25-34": 37.6, "Japan|NoSctSeuHighTenPlusCamControlSlice|25-34": 0.89, "Japan|NoSctSeuHighThreePlusCamControlSlice|25-34": 2.91, "Japan|Seu3BroadActiveControlSlice|25-34": 19.95, "Japan|HasSctSeuBroadAllCamControlSlice|25-34": 17.59, "Japan|HasSctSeuBroadThreePlusCamControlSlice|25-34": 12.33, "Japan|NoSctSeuBroadTenPlusCamControlSlice|25-34": 0.28, "Japan|NoSctSeuBroadThreePlusCamControlSlice|25-34": 0.77, "Japan|PromoShownControl|25-34": 0, "South Korea|Control|18-34": null, "South Korea|NoSctControlSlice|18-34": 13.67, "South Korea|Seu3LowActiveControlSlice|18-34": 22.09,
            "South Korea|HasSctSeuLowAllCamControlSlice|18-34": 19.78, "South Korea|HasSctSeuLowThreePlusCamControlSlice|18-34": 13.6, "South Korea|NoSctSeuLowTenPlusCamControlSlice|18-34": 0.51, "South Korea|NoSctSeuLowThreePlusCamControlSlice|18-34": 1.06, "South Korea|Seu3MedActiveControlSlice|18-34": 22.9, "South Korea|HasSctSeuMedAllCamControlSlice|18-34": 20.59, "South Korea|HasSctSeuMedThreePlusCamControlSlice|18-34": 14.71, "South Korea|NoSctSeuMedTenPlusCamControlSlice|18-34": 0.45, "South Korea|NoSctSeuMedThreePlusCamControlSlice|18-34": 1.13, "South Korea|Seu3HighActiveControlSlice|18-34": 25.13, "South Korea|HasSctSeuHighAllCamControlSlice|18-34": 22.75, "South Korea|HasSctSeuHighThreePlusCamControlSlice|18-34": 16.79, "South Korea|NoSctSeuHighTenPlusCamControlSlice|18-34": 0.42, "South Korea|NoSctSeuHighThreePlusCamControlSlice|18-34": 1.05, "South Korea|Seu3BroadActiveControlSlice|18-34": 20.4, "South Korea|HasSctSeuBroadAllCamControlSlice|18-34": 18.06, "South Korea|HasSctSeuBroadThreePlusCamControlSlice|18-34": 12.48, "South Korea|NoSctSeuBroadTenPlusCamControlSlice|18-34": 0.28, "South Korea|NoSctSeuBroadThreePlusCamControlSlice|18-34": 0.8, "South Korea|PromoShownControl|25-34": 0
        };

        // --- AI & Generation Functions ---

        async function callGemini(prompt, retries = 3, delay = 1000) {
            console.log("Gemini API: Attempting call...");
            const apiKey = GEMINI_API_KEY; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

            const payload = {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: {
                    parts: [{ text: "You are a world-class marketing analyst providing concise, actionable insights based on campaign data. Format your responses clearly using markdown." }]
                },
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    if (response.status === 429 && retries > 0) {
                        console.warn(`Gemini API: Rate limit hit (429). Retrying in ${delay / 1000}s...`);
                        await new Promise(res => setTimeout(res, delay));
                        return callGemini(prompt, retries - 1, delay * 2);
                    }
                    throw new Error(`API call failed with status: ${response.status}`);
                }

                const result = await response.json();
                const candidate = result.candidates?.[0];
                if (candidate && candidate.content?.parts?.[0]?.text) {
                    console.log("Gemini API: Call succeeded.");
                    return candidate.content.parts[0].text;
                } else {
                    console.error("Gemini API: Call succeeded but returned empty/malformed content.", result);
                    return "AI analysis could not be generated. The response was empty or malformed.";
                }
            } catch (error) {
                console.error("Gemini API call error:", error);
                if (retries > 0) {
                    await new Promise(res => setTimeout(res, delay));
                    return callGemini(prompt, retries - 1, delay * 2);
                }
                return `An error occurred while contacting the AI model: ${error.message}`;
            }
        }


        async function generateAiContent(prompt, title, contentElement, loaderElement, outputSection, titleElement) {
            outputSection.classList.remove('hidden');
            loaderElement.classList.remove('hidden');
            contentElement.classList.add('hidden');
            titleElement.textContent = title;

            try {
                const result = await callGemini(prompt);
                contentElement.innerHTML = result.replace(/### (.*?)\n/g, '<h3 class="font-bold text-slate-200 mt-2 mb-1">$1</h3>').replace(/## (.*?)\n/g, '<h2 class="font-bold text-slate-100 mt-3 mb-1">$1</h2>').replace(/\* (.*?)\n/g, '<li class="ml-4">$1</li>');

            } catch (e) {
                contentElement.innerText = `An error occurred: ${e.message}`;
            } finally {
                loaderElement.classList.add('hidden');
                contentElement.classList.remove('hidden');
                outputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function generateDeepDiveForCampaign(campaign) {
            let prompt = `Act as a marketing analyst. Provide a concise, insightful deep-dive analysis of this campaign's performance. Explain the key drivers of the recommendation. Suggest potential next steps or areas for further investigation. Format your response using markdown-style headings and bullet points for readability.\n\n`;
            prompt += `**Campaign Details:**\n`;
            prompt += `- **Name:** ${campaign.name}\n`;
            prompt += `- **Slice:** ${campaign.slice}\n`;
            prompt += `- **Market:** ${campaign.market}\n`;
            prompt += `- **Days Live:** ${campaign.daysLive}\n\n`;

            prompt += `**Performance & Recommendations:**\n`;
            const campaignId = getCampaignSliceId(campaign);
            const userOverride = recommendationOverrides[campaignId];
            const effectiveRecommendation = userOverride ? { ...userOverride, source: 'User Override' } : { ...campaign.aiRecommendation, source: 'AI Suggestion' };

            prompt += `- **Overall Recommendation:** ${effectiveRecommendation.action} (${effectiveRecommendation.source})\n`;
            prompt += `- **Reason:** ${effectiveRecommendation.reason}\n\n`;
            
            prompt += `**Segment Breakdown:**\n`;
            ['18-34', '18-24', '25-34'].forEach(seg => {
                const value = campaign.latest_week_data[`${seg === '18-34' ? 'audience_18_34' : 'sub_audience_' + seg.replace('-', '_')}_value`];
                const stat_sig = campaign.latest_week_data[`${seg === '18-34' ? 'audience_18_34' : 'sub_audience_' + seg.replace('-', '_')}_stat_sig`];
                if (value !== undefined) {
                    prompt += `- **Segment ${seg}:** Value: ${value.toFixed(2)}%, Stat Sig: ${stat_sig}\n`;
                }
            });

            generateAiContent(prompt, `✨ AI Deep Dive: ${campaign.name} (${campaign.slice})`, deepDiveContent, deepDiveLoader, deepDiveModal, deepDiveTitle);
        }

        function generateOverallAiSummary() {
            console.log("Attempting to generate AI Summary...");
            
            const FORCE_ALL_LIVE_CAMPAIGNS = false; // Set to TRUE for testing, FALSE for strict action items only.
            
            // Logic to select campaigns for summary: PAUSE, UPBID, or REVIEW (excluding MAINTAIN and BENCHMARK_BREACH PAUSE)
            const campaignsForPrompt = campaignsForAnalysis.filter(c => {
                if (c.isEnded || c.isTooNew) return false;
                
                const campaignId = getCampaignSliceId(c);
                const userOverride = recommendationOverrides[campaignId];
                const effectiveAction = userOverride ? userOverride.action : c.aiRecommendation?.action;

                if (FORCE_ALL_LIVE_CAMPAIGNS) {
                    // Include everything that wasn't explicitly deleted or ended
                    return effectiveAction !== 'DELETED' && !c.isEnded; 
                } else {
                    // Only include if actionable and not deleted
                    if (effectiveAction && effectiveAction !== 'MAINTAIN' && effectiveAction !== 'DELETED') {
                         // Explicitly filter out actions based purely on Benchmark Breach PAUSE reason
                         if (c.aiRecommendation?.reason?.startsWith('BENCHMARK_BREACH') && effectiveAction === 'PAUSE') {
                             return false;
                         }
                         return true;
                    }
                    return false;
                }
            });

            if (campaignsForPrompt.length === 0) {
                console.log("AI Summary: No highly actionable campaigns found (Pause, Upbid, or Review).");
                showInfoModal(`No highly actionable campaigns (Pause, Upbid, or Review) were found to summarize. Only actions beyond maintaining performance are included in the executive summary. If you are testing, try setting FORCE_ALL_LIVE_CAMPAIGNS = true in the code.`, "No Actions to Summarize");
                return;
            }
            console.log(`AI Summary: Found ${campaignsForPrompt.length} campaigns for action.`);
            
            const actionText = FORCE_ALL_LIVE_CAMPAIGNS ? 'ALL LIVE CAMPAIGNS (Raw Data)' : 'Actionable Only';
            let prompt = `Act as a senior marketing strategist for the APAC region. You are reviewing the following campaign recommendations for YouTube Shorts. Provide a high-level executive summary of the key trends, risks, and opportunities. Organize your response into three sections: "Key Insights", "Urgent Actions", and "Strategic Recommendations". Use markdown for formatting.\n\nHere is the data (${actionText}):\n\n`;

            const campaignsToAction = (action) => campaignsForPrompt.filter(c => {
                const campaignId = getCampaignSliceId(c);
                const userOverride = recommendationOverrides[campaignId];
                const effectiveAction = userOverride ? userOverride.action : c.aiRecommendation?.action;
                return (userOverride ? userOverride.action : c.aiRecommendation?.action) === action;
            });

            // Logic for building the prompt based on the flag
            if (FORCE_ALL_LIVE_CAMPAIGNS) {
                 prompt += "--- ALL LIVE CAMPAIGNS (Raw Data) ---\n";
                 campaignsForPrompt.forEach(c => {
                      const campaignId = getCampaignSliceId(c);
                      const userOverride = recommendationOverrides[campaignId];
                      const effectiveAction = userOverride ? userOverride.action : c.aiRecommendation?.action;
                      const reason = userOverride ? userOverride.reason : c.aiRecommendation?.reason || "N/A";
                      
                      prompt += `- Campaign: "${c.name}", Slice: "${c.slice}", Market: ${c.market}, Status: ${effectiveAction}. Reason: ${reason}`;
                      
                      ['18-34', '18-24', '25-34'].forEach(seg => {
                          const value = c.latest_week_data[`${seg === '18-34' ? 'audience_18_34' : 'sub_audience_' + seg.replace('-', '_')}_value`];
                          const sig = c.latest_week_data[`${seg === '18-34' ? 'audience_18_34' : 'sub_audience_' + seg.replace('-', '_')}_stat_sig`];
                          if (value !== undefined) {
                              prompt += ` | ${seg} Value: ${value !== null ? value.toFixed(2) : 'N/A'}%, Sig: ${sig}`;
                          }
                      });
                      prompt += "\n";
                 });
                 prompt += "\n";
            } else {
                // Use segmented list generation for actionable items (original logic)
                const campaignsToPause = campaignsToAction('PAUSE');
                const campaignsToUpbid = campaignsToAction('UPBID');
                const campaignsToReview = campaignsToAction('REVIEW: Abnormality');

                if (campaignsToPause.length > 0) {
                    prompt += "--- Campaigns Recommended for PAUSE ---\n";
                    campaignsToPause.forEach(c => {
                        const campaignId = getCampaignSliceId(c);
                        const userOverride = recommendationOverrides[campaignId];
                        const reason = userOverride ? userOverride.reason : c.aiRecommendation?.reason || "N/A";
                        prompt += `- Campaign: "${c.name}", Slice: "${c.slice}", Market: ${c.market}. Reason: ${reason}\n`;
                    });
                    prompt += "\n";
                }

                if (campaignsToUpbid.length > 0) {
                    prompt += "--- Campaigns Recommended for UPBID ---\n";
                    campaignsToUpbid.forEach(c => {
                        const campaignId = getCampaignSliceId(c);
                        const userOverride = recommendationOverrides[campaignId];
                        const reason = userOverride ? userOverride.reason : c.aiRecommendation?.reason || "N/A";
                        prompt += `- Campaign: "${c.name}", Slice: "${c.slice}", Market: ${c.market}. Reason: ${reason}\n`;
                    });
                    prompt += "\n";
                }

                if (campaignsToReview.length > 0) {
                    prompt += "--- Campaigns Recommended for REVIEW ---\n";
                    campaignsToReview.forEach(c => {
                        const campaignId = getCampaignSliceId(c);
                        const userOverride = recommendationOverrides[campaignId];
                        const reason = userOverride ? userOverride.reason : c.aiRecommendation?.reason || "N/A";
                        prompt += `- Campaign: "${c.name}", Slice: "${c.slice}", Market: ${c.market}. Reason: ${reason}\n`;
                    });
                    prompt += "\n";
                }
            }
            
            generateAiContent(prompt, '✨ AI Executive Summary', aiOutputContent, aiOutputLoader, aiOutputSection, aiOutputTitle);
        }

        // --- End of AI & Generation Functions ---

        // --- Initial Setup ---
        window.onload = () => {
            initializeAppAndAuth();
        };

        // --- Public Path Utility ---
        const getPublicCollectionRef = (collectionName) => collection(db, `artifacts/${appId}/public/data/${collectionName}`);
        const getPublicDocRef = (collectionName, docId) => doc(db, `artifacts/${appId}/public/data/${collectionName}`, docId);
        
 // --- Firebase Functions ---
async function initializeAppAndAuth() {
             try {
                 // Hardcoded Firebase Config to fix the initialization error.
                // Firebase config imported from config.js
                 
                 app = initializeApp(firebaseConfig);
                 db = getFirestore(app);
                 auth = getAuth(app);
                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        userId = user.uid;
                        isFirebaseReady = true;
                        renderAuthUI(user);
                        await fetchInitialData();
                        loadingOverlay.style.display = 'none';
                    } else {
                        // No user, try to sign in
                        try {
                            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                                await signInWithCustomToken(auth, __initial_auth_token);
                            } else {
                                await signInAnonymously(auth);
                            }
                        } catch (error) {
                            console.error("Firebase sign-in failed:", error);
                            loadingOverlay.innerHTML = `<p class="text-red-400">Authentication failed. Please refresh.</p>`;
                        }
                    }
                });
            } catch (e) {
                console.error("Could not initialize Firebase. Running in local mode.", e);
                loadingOverlay.innerHTML = `<p class="text-amber-400">Could not connect to database. Running in local fallback mode.</p>`;
                setTimeout(() => {
                    initializeLocalApp(); // Fallback to local mode if Firebase fails
                }, 2000);
            }
        }
        
        async function fetchInitialData() {
            if (!isFirebaseReady || !userId) return;
            await fetchBenchmarksFromFirestore();
            listenToRepositoryData();
            listenToPauseReliveRepositoryData();
            listenToPersistentMemoryRepositoryData();
            resetUI();
        }

        function renderAuthUI(user) {
            if (user) {
                const userEmail = user.email || `User: ${user.uid}`;
                authContainer.innerHTML = `
                    <div class="flex flex-col items-end gap-1">
                        <p class="text-xs text-slate-400">User ID: ${user.uid}</p>
                        <button id="sign-out-btn" class="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-1 px-2 rounded-md transition-colors">Sign Out</button>
                    </div>
                `;
                document.getElementById('sign-out-btn').addEventListener('click', () => signOut(auth));
            } else {
                authContainer.innerHTML = '';
            }
        }

        // --- Data Functions ---
        async function fetchBenchmarksFromFirestore() {
            if (!isFirebaseReady) {
                hardcodedBenchmarks = defaultBenchmarks;
                return;
            }
            const docRef = getPublicDocRef('benchmarks', 'default');
            try {
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    hardcodedBenchmarks = docSnap.data().benchmarks || defaultBenchmarks;
                } else {
                    hardcodedBenchmarks = defaultBenchmarks;
                    await saveBenchmarksToFirestore(hardcodedBenchmarks, false); // Save defaults if not exist, no notification
                }
            } catch (e) {
                console.error("Error fetching benchmarks, using defaults:", e);
                hardcodedBenchmarks = defaultBenchmarks;
            } finally {
                renderBenchmarkTable();
            }
        }

        async function saveBenchmarksToFirestore(benchmarks, showNotification = true) {
            if (!isFirebaseReady) {
                if(showNotification) {
                    showInfoModal("Cannot save. No database connection.", "Error");
                }
                return;
            }
            const docRef = getPublicDocRef('benchmarks', 'default');
            try {
                await setDoc(docRef, { benchmarks });
                if (showNotification) {
                    showInfoModal("Benchmarks have been successfully updated.", "Success");
                }
            } catch (e) {
                console.error("Error saving benchmarks:", e);
                 if (showNotification) {
                    showInfoModal("An error occurred while saving benchmarks.", "Error");
                }
            }
        }

        function listenToRepositoryData() {
            if (!isFirebaseReady) return;
            const repoRef = getPublicCollectionRef('datasets');
            
            unsubscribeRepository(); 
            
            unsubscribeRepository = onSnapshot(repoRef, (querySnapshot) => {
                const allData = {};
                querySnapshot.forEach((doc) => {
                    const data = { id: doc.id, ...doc.data() };
                    if (!allData[data.country]) {
                        allData[data.country] = [];
                    }
                    allData[data.country].push(data);
                });
                localDataRepository = allData;
                renderRepository();
            }, (error) => {
                console.error("Error listening to repository data:", error);
                showInfoModal("Could not connect to the data repository. Please check your connection and refresh.", "Connection Error");
            });
        }

        function listenToPauseReliveRepositoryData() {
            if (!isFirebaseReady) return;
            const repoRef = getPublicCollectionRef('pauseReliveDatasets');
            
            unsubscribePauseReliveRepository(); 
            
            unsubscribePauseReliveRepository = onSnapshot(repoRef, (querySnapshot) => {
                const allData = [];
                querySnapshot.forEach((doc) => {
                    allData.push({ id: doc.id, ...doc.data() });
                });
                localPauseReliveRepository = allData;
                renderRepository();
            }, (error) => {
                console.error("Error listening to Pause/Relive repository data:", error);
            });
        }
        
        function listenToPersistentMemoryRepositoryData() {
            if (!isFirebaseReady) return;
            const repoRef = getPublicCollectionRef('persistentMemory');
            
            unsubscribePersistentMemoryRepository(); 
            
            unsubscribePersistentMemoryRepository = onSnapshot(repoRef, (querySnapshot) => {
                const allData = [];
                querySnapshot.forEach((doc) => {
                    allData.push({ id: doc.id, ...doc.data() });
                });
                localPersistentMemoryRepository = allData;
                renderRepository();
            }, (error) => {
                console.error("Error listening to Persistent Memory repository data:", error);
            });
        }


        async function saveDatasetToFirestore(dataset) {
            if (!isFirebaseReady) {
                showInfoModal("Cannot save. No database connection.", "Error");
                return;
            }
            const { id, data, ...metadata } = dataset;
            const docRef = getPublicDocRef('datasets', String(id));
            const rowsRef = collection(db, `artifacts/${appId}/public/data/datasets/${String(id)}/rows`);

            try {
                await setDoc(docRef, metadata);

                const batchSize = 400; 
                for (let i = 0; i < data.length; i += batchSize) {
                    const batch = writeBatch(db);
                    const chunk = data.slice(i, i + batchSize);
                    chunk.forEach((rowData) => {
                        const rowDocRef = doc(rowsRef);
                        batch.set(rowDocRef, rowData);
                    });
                    await batch.commit();
                }
            } catch(e) {
                console.error("Error saving dataset:", e);
                showInfoModal(`Failed to save dataset to the database. Error: ${e.message}`, "Error");
            }
        }

        async function savePauseReliveDatasetToFirestore(dataset) {
            if (!isFirebaseReady) {
                showInfoModal("Cannot save Pause/Relive file. No database connection.", "Error");
                return null;
            }
            const { id, ...dataToSave } = dataset;
            const docRef = getPublicDocRef('pauseReliveDatasets', String(id));
            try {
                await setDoc(docRef, dataToSave);
                showInfoModal(`Saved "${dataToSave.name}" to the Pause/Relive repository.`, "File Saved");
                return {id, ...dataToSave};
            } catch (e) {
                console.error("Error saving Pause/Relive dataset:", e);
                showInfoModal(`Failed to save Pause/Relive file to the database. Error: ${e.message}`, "Error");
                return null;
            }
        }

        async function saveWeeklyDatasetToFirestore(dataset) {
            if (!isFirebaseReady) {
                showInfoModal("Cannot save Weekly Data file. No database connection.", "Error");
                return null;
            }
            const { id, ...dataToSave } = dataset;
            const docRef = getPublicDocRef('persistentMemory', String(id));
            try {
                await setDoc(docRef, dataToSave);
                showInfoModal(`Saved "${dataToSave.name}" to Persistent Memory.`, "File Saved");
                return {id, ...dataToSave};
            } catch (e) {
                console.error("Error saving Weekly Data dataset:", e);
                showInfoModal(`Failed to save Weekly Data file to the database. Error: ${e.message}`, "Error");
                return null;
            }
        }

        async function deleteDatasetFromFirestore(datasetId) {
             if (!isFirebaseReady) {
                 showInfoModal("Cannot delete. No database connection.", "Error");
                 return;
            }
            const docRef = getPublicDocRef('datasets', datasetId);
            const rowsRef = collection(db, `artifacts/${appId}/public/data/datasets/${datasetId}/rows`);
            
            try {
                const querySnapshot = await getDocs(rowsRef);
                const batch = writeBatch(db);
                querySnapshot.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();

                await deleteDoc(docRef);
                
                const overridesRef = getPublicDocRef('overrides', datasetId);
                await deleteDoc(overridesRef);

                if (selectedDatasetId == datasetId) {
                    selectedDatasetId = null;
                    updateAnalyzeButtonState();
                }
                showInfoModal("Dataset deleted successfully.", "Success");
            } catch(e) {
                console.error("Error deleting dataset:", e);
                showInfoModal("Failed to delete dataset from the database.", "Error");
            }
        }

        async function deletePauseReliveDatasetFromFirestore(datasetId) {
            if (!isFirebaseReady) {
                showInfoModal("Cannot delete. No database connection.", "Error");
                return;
            }
            const docRef = getPublicDocRef('pauseReliveDatasets', datasetId);
            try {
                await deleteDoc(docRef);
                if (selectedPauseReliveDatasetId == datasetId) {
                    selectedPauseReliveDatasetId = null;
                    updateAnalyzeButtonState();
                }
                 showInfoModal("Pause/Relive file deleted successfully.", "Success");
            } catch (e) {
                console.error("Error deleting Pause/Relive dataset:", e);
                showInfoModal("Failed to delete Pause/Relive file from the database.", "Error");
            }
        }

        async function deletePersistentMemoryDatasetFromFirestore(datasetId) {
            if (!isFirebaseReady) {
                showInfoModal("Cannot delete. No database connection.", "Error");
                return;
            }
            const docRef = getPublicDocRef('persistentMemory', datasetId);
            try {
                await deleteDoc(docRef);
                if (selectedPersistentMemoryDatasetId == datasetId) {
                    selectedPersistentMemoryDatasetId = null;
                }
                 showInfoModal("Weekly Data file deleted successfully.", "Success");
            } catch (e) {
                console.error("Error deleting Weekly Data dataset:", e);
                showInfoModal("Failed to delete Weekly Data file from the database.", "Error");
            }
        }
        
        async function fetchOverridesForAnalysis() {
            if (!isFirebaseReady || !selectedDatasetId || typeof selectedDatasetId !== 'string') {
                recommendationOverrides = {};
                return;
            };
            // FIX: Ensure ID is cast to string here, though the check above handles null/undefined/non-string
            const overridesRef = getPublicDocRef('overrides', String(selectedDatasetId));
            try {
                const docSnap = await getDoc(overridesRef);
                if (docSnap.exists()) {
                    recommendationOverrides = docSnap.data();
                } else {
                    recommendationOverrides = {};
                }
            } catch (e) {
                console.error("Error fetching overrides:", e);
                recommendationOverrides = {};
            }
        }

        async function saveOrDeleteOverride(campaignId, overrideData) {
            if (!isFirebaseReady || !selectedDatasetId) return;
             const overridesRef = getPublicDocRef('overrides', selectedDatasetId);
            try {
                if (overrideData) {
                    await setDoc(overridesRef, { [campaignId]: overrideData }, { merge: true });
                } else {
                    const docSnap = await getDoc(overridesRef);
                    if (docSnap.exists()) {
                        const existingOverrides = docSnap.data();
                        delete existingOverrides[campaignId];
                        await setDoc(overridesRef, existingOverrides);
                    }
                }
            } catch(e) {
                console.error("Error saving/deleting override:", e);
            }
        }

        function initializeLocalApp() {
            loadingOverlay.style.display = 'none';
            authContainer.innerHTML = `<p class="text-xs text-slate-400">Local Mode</p>`;
            hardcodedBenchmarks = defaultBenchmarks;
            renderBenchmarkTable();
            renderRepository();
            resetUI();
        }


        // --- Custom Modals ---
        function showInfoModal(message, title = 'Notification') {
            infoModalTitle.textContent = title;
            infoModalContent.textContent = message;
            infoModal.classList.remove('hidden');
        }

        function showConfirmModal(message, onConfirmCallback) {
            confirmModalContent.textContent = message;
            
            const oldBtn = document.getElementById('confirm-modal-confirm-btn');
            const newBtn = oldBtn.cloneNode(true);
            
            if (oldBtn.parentNode) {
                oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            }
            
            newBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
                onConfirmCallback();
            }, { once: true });

            confirmModal.classList.remove('hidden');
        }
        
        // --- File Handling Functions (Moved up to be globally available before listeners) ---
        
        function handleFile(file) {
            if (file && file.type === 'text/csv') {
                fileNameDisplay.innerHTML = `Loading file: <span class="font-bold text-purple-400">${file.name}</span>`;
                errorDiv.innerHTML = '';
                showMappingModal(file, file.name, 'CSV', 'summary');
            } else {
                errorDiv.innerHTML = '<p>Error: Only CSV files are accepted.</p>';
                fileNameDisplay.innerHTML = '';
            }
        }

        async function handlePauseReliveFile(file, type = 'CSV') {
            if (!file || file.type !== 'text/csv') {
                showInfoModal("Please select a valid CSV file for Pause/Relive rules.", "Invalid File");
                return;
            }
            pauseFileNameDisplay.innerHTML = `Loading rules: <span class="font-bold text-purple-400">${file.name}</span>`;
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const rawData = e.target.result;
                const parsed = Papa.parse(rawData, { header: true, skipEmptyLines: true });

                if (parsed.errors.length > 0) {
                    showInfoModal(`Error parsing Pause/Relive CSV: ${parsed.errors[0].message}`, "Parsing Error");
                    return;
                }
                
                const newDataset = {
                    id: Date.now(),
                    name: file.name,
                    type: type,
                    rulesCount: parsed.data.length,
                    createdAt: new Date().toISOString(),
                    rawData: rawData
                };
                const savedData = await savePauseReliveDatasetToFirestore(newDataset);
                if(savedData){
                    selectedPauseReliveDatasetId = savedData.id;
                    updateAnalyzeButtonState();
                }
            };
            reader.readAsText(file);
        }

        async function handleWeeklyDataFile(file, type = 'CSV') {
            if (!file || file.type !== 'text/csv') {
                showInfoModal("Please select a valid CSV file for Weekly Data.", "Invalid File");
                return;
            }
            weeklyDataFileNameDisplay.innerHTML = `Loading weekly data: <span class="font-bold text-purple-400">${file.name}</span>`;
            
            // Go straight to mapping modal
            showMappingModal(file, file.name, type, 'weekly');
        }

        // --- Event Listeners ---
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length) { handleFile(files[0]); }
        });
        fileInput.addEventListener('change', () => { if (fileInput.files.length) { handleFile(fileInput.files[0]); } });
        analyzeBtn.addEventListener('click', runFullAnalysis);
        downloadBtn.addEventListener('click', downloadResults);
        newAnalysisBtn.addEventListener('click', resetUI);
        closeAiOutputBtn.addEventListener('click', () => aiOutputSection.classList.add('hidden'));
        closeDeepDiveModalBtn.addEventListener('click', () => deepDiveModal.classList.add('hidden'));
        deepDiveModal.addEventListener('click', (e) => { if (e.target === deepDiveModal) { deepDiveModal.classList.add('hidden') } });
        backBtn.addEventListener('click', resetUI);
        loadSheetBtn.addEventListener('click', loadFromSheet);
        cancelMappingBtn.addEventListener('click', () => mappingModal.classList.add('hidden'));
        updateBenchmarksBtn.addEventListener('click', () => benchmarkFileInput.click());
        benchmarkFileInput.addEventListener('change', handleBenchmarkFileUpload);
        
        infoModalCloseBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
        infoModal.addEventListener('click', (e) => { if (e.target === infoModal) { infoModal.classList.add('hidden'); } });

        confirmModalCancelBtn.addEventListener('click', () => confirmModal.classList.add('hidden'));
        confirmModal.addEventListener('click', (e) => { if (e.target === confirmModal) { confirmModal.classList.add('hidden'); } });

        pauseDropZone.addEventListener('dragover', (e) => { e.preventDefault(); pauseDropZone.classList.add('drag-over'); });
        pauseDropZone.addEventListener('dragleave', () => pauseDropZone.classList.remove('drag-over'));
        pauseDropZone.addEventListener('drop', (e) => {
            e.preventDefault(); pauseDropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length) { handlePauseReliveFile(files[0]); }
        });
        pauseFileInput.addEventListener('change', () => { if (pauseFileInput.files.length) { handlePauseReliveFile(pauseFileInput.files[0]); } });
        loadPauseSheetBtn.addEventListener('click', loadPauseSheet);

        weeklyDataDropZone.addEventListener('dragover', (e) => { e.preventDefault(); weeklyDataDropZone.classList.add('drag-over'); });
        weeklyDataDropZone.addEventListener('dragleave', () => weeklyDataDropZone.classList.remove('drag-over'));
        weeklyDataDropZone.addEventListener('drop', (e) => {
            e.preventDefault(); weeklyDataDropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length) { handleWeeklyDataFile(files[0]); }
        });
        weeklyDataFileInput.addEventListener('change', () => { if (weeklyDataFileInput.files.length) { handleWeeklyDataFile(weeklyDataFileInput.files[0]); } });
        loadWeeklyDataSheetBtn.addEventListener('click', loadWeeklyDataSheet);


        tabsNav.addEventListener('click', (e) => {
            if(e.target.matches('.tab-btn')) {
                const targetPanelId = e.target.dataset.target;
                tabsNav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                document.querySelectorAll('#tables-container > .tab-panel').forEach(panel => {
                    panel.classList.toggle('hidden', panel.id !== targetPanelId);
                });
            }
        });

        // Universal handler for buttons that require a defined function globally (like the AI Summary button)
        document.addEventListener('click', (e) => {
            if (e.target.id === 'get-ai-summary-btn') {
                 // Check for definition just before calling
                 if (typeof generateOverallAiSummary === 'function') {
                    generateOverallAiSummary();
                 } else {
                     console.error("generateOverallAiSummary function is not defined.");
                     showInfoModal("The AI Summary feature is not available due to a setup error.", "Error");
                 }
            }
        });

        // Removed AI Filter toggle listener
        // document.addEventListener('change', (e) => {
        //     if (e.target.id === 'ai-filter-toggle') {
        //         showAllActions = e.target.checked;
        //         console.log(`AI filter changed. Show all campaigns: ${showAllActions}`);
        //     }
        // });


        resultContainer.addEventListener('click', (e) => {
            if (e.target.matches('.country-tab-btn')) {
                const countryNav = e.target.closest('.country-tabs-nav');
                if (countryNav) {
                    const targetPanelId = e.target.dataset.target;
                    const countryContainer = countryNav.nextElementSibling;
                    countryNav.querySelectorAll('.country-tab-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    countryContainer.querySelectorAll('.country-tab-panel').forEach(panel => {
                        panel.classList.toggle('hidden', panel.id !== targetPanelId);
                    });
                }
            }
             if (e.target.matches('.campaign-sub-tab-btn')) {
                const subTabNav = e.target.closest('.campaign-sub-tabs-nav');
                if (subTabNav) {
                    const targetPanelId = e.target.dataset.target;
                    const subTabContainer = subTabNav.nextElementSibling;
                    subTabNav.querySelectorAll('.campaign-sub-tab-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    subTabContainer.querySelectorAll('.campaign-sub-tab-panel').forEach(panel => {
                        panel.classList.toggle('hidden', panel.id !== targetPanelId);
                    });
                }
            }
            if (e.target.matches('.stat-sig-tab-btn')) {
                const targetPanelId = e.target.dataset.target;
                const statSigNav = document.getElementById('stat-sig-tabs-nav');
                const statSigContainer = document.getElementById('stat-sig-tables-container');
                if (statSigNav && statSigContainer) {
                    statSigNav.querySelectorAll('.stat-sig-tab-btn').forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    statSigContainer.querySelectorAll('.stat-sig-tab-panel').forEach(panel => {
                        panel.classList.toggle('hidden', panel.id !== targetPanelId);
                    });
                }
            }
        });

        // --- Core Functions ---
        function resetUI() {
            document.getElementById('input-section').classList.remove('hidden');
            repositorySection.classList.remove('hidden');
            document.getElementById('benchmark-section').classList.remove('hidden');
            resultContainer.classList.add('hidden');
            placeholderResult.classList.remove('hidden');
            actionButtons.classList.add('hidden');
            aiOutputSection.classList.add('hidden');
            errorDiv.innerHTML = '';
            uploadText.innerHTML = `Upload your CSV`;
            fileNameDisplay.innerHTML = '';
            fileInput.value = '';
            googleSheetUrlInput.value = '';
            campaignsForAnalysis = [];
            lastResults = [];
            selectedDatasetId = null;
            selectedPauseReliveDatasetId = null;
            selectedPersistentMemoryDatasetId = null;
            updateAnalyzeButtonState();
            tabsNav.innerHTML = '';
            document.getElementById('tables-container').innerHTML = '';
            renderRepository(); 
            pauseReliveRules = {};
            pauseFileNameDisplay.innerHTML = '';
            pauseFileInput.value = '';
            weeklyDataFileNameDisplay.innerHTML = '';
            weeklyDataFileInput.value = '';
        }

        async function runFullAnalysis() {
            if (!selectedDatasetId) {
                showInfoModal('Please select a dataset from the repository to analyze.', 'Error');
                return;
            }

            analyzeBtn.textContent = 'Fetching Data & Analyzing...';
            analyzeBtn.disabled = true;
            actionButtons.classList.add('hidden');
            aiOutputSection.classList.add('hidden');
            document.getElementById('input-section').classList.add('hidden');
            repositorySection.classList.add('hidden');
            document.getElementById('benchmark-section').classList.add('hidden');

            try {
                let weeklyRawData = null;
                let weeklyColumnMap = null;
                if (selectedPersistentMemoryDatasetId) {
                    analyzeBtn.textContent = 'Fetching Weekly Data...';
                    // FIX: Ensure ID is cast to string to prevent TypeError inside Firestore doc() function
                    const weeklyDocRef = getPublicDocRef('persistentMemory', String(selectedPersistentMemoryDatasetId));
                    const docSnap = await getDoc(weeklyDocRef);
                    if (docSnap.exists() && docSnap.data().rawData) {
                        weeklyRawData = docSnap.data().rawData;
                        weeklyColumnMap = docSnap.data().columnMap;
                    } else {
                        console.warn(`Selected Weekly Data dataset ${selectedPersistentMemoryDatasetId} not found or has no data.`);
                    }
                }

                pauseReliveRules = {};
                if (selectedPauseReliveDatasetId) {
                    analyzeBtn.textContent = 'Fetching Pause Rules...';
                    // FIX: Ensure ID is cast to string to prevent TypeError inside Firestore doc() function
                    const pauseDocRef = getPublicDocRef('pauseReliveDatasets', String(selectedPauseReliveDatasetId));
                    const docSnap = await getDoc(pauseDocRef);
                    if (docSnap.exists() && docSnap.data().rawData) {
                        parsePauseReliveRulesFromString(docSnap.data().rawData);
                    } else {
                        console.warn(`Selected Pause/Relive dataset ${selectedPauseReliveDatasetId} not found or has no data.`);
                    }
                }

                analyzeBtn.textContent = 'Fetching Campaign Data...';
                await fetchOverridesForAnalysis();
                
                const rowsRef = collection(db, `artifacts/${appId}/public/data/datasets/${selectedDatasetId}/rows`);
                const querySnapshot = await getDocs(rowsRef);
                const selectedData = querySnapshot.docs.map(doc => doc.data());
                
                if (selectedData && selectedData.length > 0) {
                    processData(selectedData, weeklyRawData, weeklyColumnMap); // Passed map here
                } else {
                    throw new Error("Selected dataset is empty or could not be found.");
                }

            } catch (e) {
                errorDiv.innerHTML = `<p>An unexpected error occurred during analysis: ${e.message}</p>`;
                console.error("Detailed Error:", e);
                // --- FIX: Restore the UI so the user can see the error message ---
                document.getElementById('input-section').classList.remove('hidden');
                repositorySection.classList.remove('hidden');
                document.getElementById('benchmark-section').classList.remove('hidden');
                // --- END OF FIX ---
            } finally {
                analyzeBtn.textContent = 'Analyze Data';
                updateAnalyzeButtonState();
            }
        }

        function processData(allRows, weeklyRawData, weeklyColumnMap) {
            if (!allRows || allRows.length === 0) {
                errorDiv.innerHTML = '<p>The CSV file is empty or could not be read.</p>';
                return;
            }

            try {
                campaignsForAnalysis = createCampaignObjectsFromLongFormat(allRows);
                
                if (campaignsForAnalysis.length === 0) {
                    throw new Error("No valid campaign data could be processed from the file. Check column mapping and data format.");
                }

                const campaignsByCountry = campaignsForAnalysis.reduce((acc, c) => {
                    if (!acc[c.market]) acc[c.market] = [];
                    acc[c.market].push(c);
                    return acc;
                }, {});

                const abnormalSlicesByCountry = {};
                for (const country in campaignsByCountry) {
                    abnormalSlicesByCountry[country] = checkForSliceAbnormalities(campaignsByCountry[country]);
                }

                campaignsForAnalysis.forEach(campaign => {
                    const abnormalSlices = abnormalSlicesByCountry[campaign.market] || {};
                    runDecisionEngine(campaign, abnormalSlices);
                    
                    let primaryAiAction = { action: 'MAINTAIN', reason: 'Neutral performance.', segment: '18-34' };
                    const aiActions = [];
                    if (campaign.overrideAction) {
                        if (campaign.overrideAction.action !== 'MAINTAIN') aiActions.push({ ...campaign.overrideAction, segment: '18-34' });
                    } else {
                        const parentAction = campaign.segments['audience_18_34']?.actions?.[0];
                        if (parentAction && parentAction.action !== 'MAINTAIN') {
                            aiActions.push({ ...parentAction, segment: '18-34' });
                        } else {
                            const firstChildActionWithSegment = ['18-24', '25-34']
                                .map(seg => ({ action: campaign.segments[seg]?.actions?.[0], segment: seg }))
                                .find(item => item.action && item.action.action !== 'MAINTAIN');
                            if (firstChildActionWithSegment) {
                                aiActions.push({ ...firstChildActionWithSegment.action, segment: firstChildActionWithSegment.segment });
                            }
                        }
                    }
                    if (aiActions.length > 0) {
                        primaryAiAction = aiActions[0];
                    }
                    campaign.aiRecommendation = primaryAiAction;
                });

                displayRecommendations(campaignsForAnalysis, weeklyRawData, weeklyColumnMap); // Passed map here

            } catch (e) {
                errorDiv.innerHTML = `<p><strong>Analysis Error:</strong> ${e.message}</p>`;
                console.error("Detailed Error:", e);
                resultContainer.classList.add('hidden');
                placeholderResult.classList.remove('hidden');
                actionButtons.classList.add('hidden');
            }
        }

        async function loadFromSheet() {
            const url = googleSheetUrlInput.value.trim();
            if (!url) {
                errorDiv.textContent = 'Please enter a Google Sheet URL.';
                return;
            }
            const transformedUrl = transformGoogleSheetUrl(url);
            if (!transformedUrl) {
                errorDiv.textContent = 'Invalid Google Sheet URL format.';
                return;
            }

            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(transformedUrl)}`;

            fileNameDisplay.innerHTML = 'Loading from Google Sheet...';
            errorDiv.textContent = '';
            loadSheetBtn.textContent = 'Loading...';
            loadSheetBtn.disabled = true;

            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Failed to fetch from proxy with status: ${response.status}`);
                const textData = await response.text();

                if (textData.trim().toLowerCase().startsWith('<!doctype html')) {
                    throw new Error("The Google Sheet is not public. Please set sharing to 'Anyone with the link' > 'Viewer'.");
                }
                
                const file = new Blob([textData], { type: 'text/csv' });
                showMappingModal(file, `Sheet Data (${new Date().toLocaleTimeString()})`, 'Google Sheet', 'summary');

            } catch (error) {
                 errorDiv.innerHTML = `<p class="font-bold">Failed to load Google Sheet:</p><p>${error.message}</p>`;
                 fileNameDisplay.innerHTML = '';
            } finally {
                 loadSheetBtn.textContent = 'Load from Sheet';
                 loadSheetBtn.disabled = false;
            }
        }

        async function loadPauseSheet() {
            const url = pauseGoogleSheetUrlInput.value.trim();
            if (!url) {
                showInfoModal('Please enter a Google Sheet URL for pause/relive instructions.', 'Error');
                return;
            }
            const transformedUrl = transformGoogleSheetUrl(url);
            if (!transformedUrl) {
                showInfoModal('Invalid Google Sheet URL format.', 'Error');
                return;
            }

            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(transformedUrl)}`;

            pauseFileNameDisplay.innerHTML = 'Loading rules from Google Sheet...';
            loadPauseSheetBtn.textContent = 'Loading...';
            loadPauseSheetBtn.disabled = true;

            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Failed to fetch from proxy with status: ${response.status}`);
                const textData = await response.text();

                if (textData.trim().toLowerCase().startsWith('<!doctype html')) {
                    throw new Error("The Google Sheet is not public. Please set sharing to 'Anyone with the link' > 'Viewer'.");
                }
                
                const file = new File([textData], `PauseReliveSheet_${new Date().getTime()}.csv`, { type: 'text/csv' });
                handlePauseReliveFile(file, 'Google Sheet');

            } catch (error) {
                 showInfoModal(`Failed to load Google Sheet: ${error.message}`, 'Error');
                 pauseFileNameDisplay.innerHTML = '';
            } finally {
                 loadPauseSheetBtn.textContent = 'Load from Sheet';
                 loadPauseSheetBtn.disabled = false;
            }
        }

        async function loadWeeklyDataSheet() {
            const url = weeklyDataGoogleSheetUrlInput.value.trim();
            if (!url) {
                showInfoModal('Please enter a Google Sheet URL for the weekly data.', 'Error');
                return;
            }
            const transformedUrl = transformGoogleSheetUrl(url);
            if (!transformedUrl) {
                showInfoModal('Invalid Google Sheet URL format.', 'Error');
                return;
            }

            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(transformedUrl)}`;

            weeklyDataFileNameDisplay.innerHTML = 'Loading weekly data from Google Sheet...';
            loadWeeklyDataSheetBtn.textContent = 'Loading...';
            loadWeeklyDataSheetBtn.disabled = true;

            try {
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error(`Failed to fetch from proxy with status: ${response.status}`);
                const textData = await response.text();

                if (textData.trim().toLowerCase().startsWith('<!doctype html')) {
                    throw new Error("The Google Sheet is not public. Please set sharing to 'Anyone with the link' > 'Viewer'.");
                }
                
                const file = new File([textData], `WeeklyDataSheet_${new Date().getTime()}.csv`, { type: 'text/csv' });
                showMappingModal(file, file.name, 'Google Sheet', 'weekly');

            } catch (error) {
                 showInfoModal(`Failed to load Google Sheet: ${error.message}`, 'Error');
                 weeklyDataFileNameDisplay.innerHTML = '';
            } finally {
                 loadWeeklyDataSheetBtn.textContent = 'Load from Sheet';
                 loadWeeklyDataSheetBtn.disabled = false;
            }
        }


        function parsePauseReliveRulesFromString(csvString) {
            const newRules = {};
            Papa.parse(csvString, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    results.data.forEach(row => {
                        let country = row.Country?.trim();
                        const age = row.Age?.trim();
                        const campaign = row.Campaign?.trim();
                        const slice = row.Slice?.trim();
                        const action = row.Optimisation?.trim().toUpperCase();
                        const date = parseDate(row['Launch date (m/d)']);

                        if (!country || !age || !slice || !action || !date) {
                            console.warn("Skipping invalid rule row:", row);
                            return;
                        }
                        
                        country = normalizeCountryName(country);
                        
                        const campaignKey = (campaign || 'ALL').toLowerCase();
                        const key = `${country}|${age}|${slice}|${campaignKey}`;
                        
                        if (!newRules[key] || date > newRules[key].date) {
                            newRules[key] = { action, date };
                        }
                    });
                }
            });
            pauseReliveRules = newRules;
        }


        function getAppliedRule(country, age, slice, campaignName) {
            if (Object.keys(pauseReliveRules).length === 0) return null;

            // Priority 1: Exact campaign match (now case-insensitive)
            let key = `${country}|${age}|${slice}|${campaignName.toLowerCase()}`;
            if (pauseReliveRules[key]) {
                return pauseReliveRules[key];
            }

            // Priority 2: "shelf" keyword match
            if (campaignName.toLowerCase().includes('shelf')) {
                key = `${country}|${age}|${slice}|shelf`;
                if (pauseReliveRules[key]) {
                    return pauseReliveRules[key];
                }
            }

            // Priority 3: Wildcard 'ALL' campaigns match
            key = `${country}|${age}|${slice}|all`;
            if (pauseReliveRules[key]) {
                return pauseReliveRules[key];
            }

            return null;
        }

        // --- Smart Mapping Functions (Unified) ---
        function showMappingModal(file, name, type, mode) {
            
            let requiredFields, modalTitleText, modalDescText;

            if (mode === 'summary') {
                requiredFields = SUMMARY_INPUT_MAPPING_FIELDS;
                modalTitleText = 'Confirm Summary Input Mapping';
                modalDescText = 'Map the required columns for the **Summary Input**. Data will be processed and saved.';
            } else if (mode === 'weekly') {
                requiredFields = WEEKLY_DATA_MAPPING_FIELDS;
                modalTitleText = 'Confirm Weekly Data Mapping';
                modalDescText = 'Map the required metadata columns for the **Weekly Trend Data**. The original CSV text will be saved as is for display.';
            } else {
                return; 
            }
            
            mappingModalTitle.textContent = modalTitleText;
            mappingModalDescription.innerHTML = modalDescText;


            Papa.parse(file, {
                header: true,
                preview: 3, 
                complete: (previewResults) => {
                    const headers = previewResults.meta.fields;
                    const previewData = previewResults.data;
                    const guessedMap = intelligentlyMapHeaders(headers, mode);
                    mappingContainer.innerHTML = ''; 

                    const previewContainer = document.createElement('div');
                    previewContainer.className = 'overflow-x-auto rounded-lg border border-slate-700 max-h-48 mb-4';
                    const previewTable = document.createElement('table');
                    previewTable.className = 'min-w-full text-xs text-left';
                    previewTable.innerHTML = `
                        <thead class="bg-slate-800">
                            <tr>${headers.map(h => `<th class="p-2 font-medium">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700">
                            ${previewData.map(row => `<tr>${headers.map(h => `<td class="p-2 whitespace-nowrap text-slate-400">${row[h] || ''}</td>`).join('')}</tr>`).join('')}
                        </tbody>
                    `;
                    previewContainer.appendChild(previewTable);
                    mappingContainer.appendChild(previewContainer);
                    
                    // Define which fields are optional based on mode
                    const optionalKeys = (mode === 'weekly') ? 
                        ['shorts_dac_sct', 'campaign_start_date', 'campaign_end_date', 'rasta_end_date', 'stat_sig'] : 
                        ['stat_sig'];


                    // Render mapping fields
                    requiredFields.forEach(field => {
                        const row = document.createElement('div');
                        row.className = "grid grid-cols-1 md:grid-cols-2 gap-2 items-center border-b border-slate-700 pb-3";
                        const labelDiv = document.createElement('div');
                        // Highlight the new field as a structural requirement check
                        const nameClass = field.key === 'week_column' ? 'text-yellow-300' : 'text-slate-200';
                        labelDiv.innerHTML = `<label class="font-semibold ${nameClass}">${field.name}</label><p class="text-xs text-slate-400">${field.description}</p>`;
                        
                        const selectDiv = document.createElement('div');
                        const select = document.createElement('select');
                        select.id = `map-select-${field.key}`;
                        select.className = "w-full bg-slate-800 border border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-200";
                        select.innerHTML = '';
                        
                        const isFieldOptional = optionalKeys.includes(field.key);
                        const isLongFormatWeekField = field.key === 'week_column' && mode === 'weekly';

                        if (!guessedMap[field.key] && !isFieldOptional && !isLongFormatWeekField) {
                            const placeholder = document.createElement('option');
                            placeholder.value = "";
                            placeholder.disabled = true;
                            placeholder.selected = true;
                            placeholder.appendChild(document.createTextNode('-- Please select a column --'));
                            select.appendChild(placeholder);
                        }
                        if (isFieldOptional) {
                            const notInFileOption = document.createElement('option');
                            notInFileOption.value = "";
                            notInFileOption.appendChild(document.createTextNode('Not in file / Not required'));
                            select.appendChild(notInFileOption);
                        }
                        headers.forEach(header => {
                            const option = document.createElement('option');
                            option.value = header;
                            option.appendChild(document.createTextNode(header));
                            if (guessedMap[field.key] === header) {
                                option.selected = true;
                            }
                            select.appendChild(option);
                        });
                        selectDiv.appendChild(select);
                        row.appendChild(labelDiv);
                        row.appendChild(selectDiv);
                        mappingContainer.appendChild(row);
                    });
                    
                    mappingModal.classList.remove('hidden');

                    if (currentConfirmHandler) {
                        confirmMappingBtn.removeEventListener('click', currentConfirmHandler);
                    }
                    
                    currentConfirmHandler = () => {
                        const userMap = {};
                        let isValid = true;
                        
                        requiredFields.forEach(field => {
                            const select = document.getElementById(`map-select-${field.key}`);
                            const isFieldOptional = optionalKeys.includes(field.key);
                            const isLongFormatWeekField = field.key === 'week_column' && mode === 'weekly';

                            if (select.value) {
                                userMap[field.key] = select.value;
                            } else if (!isFieldOptional && !isLongFormatWeekField) {
                                // Standard required fields
                                isValid = false;
                            } else if (isLongFormatWeekField && !select.value) {
                                // The special weekly check field MUST have a value if in weekly mode
                                isValid = false;
                            }
                        });

                        if (!isValid) {
                            showInfoModal(`Please map all **required** fields for ${mode === 'summary' ? 'Summary Input' : 'Weekly Data'}.`, "Mapping Incomplete");
                            return;
                        }
                        
                        // The user confirmed their Weekly Data is in Long Format. Check for the old Wide Format columns and warn if they exist.
                        if (mode === 'weekly') {
                             const isWideFormat = headers.some(h => /^W(eek)?\s*\d+$/i.test(h));
                             if (isWideFormat) {
                                 showInfoModal("Warning: Your CSV contains columns like 'Week1', 'Week2', etc. The Weekly Campaign Data tab is designed to display this wide-format data, but your mapping suggests a Long Format (single 'Week' column). Please ensure your interpretation is correct for the intended visualization.", "Format Conflict Warning");
                             }
                        }
                        
                        confirmMappingBtn.disabled = true;
                        confirmMappingBtn.textContent = 'Processing...';

                        // --- Save Handler Logic ---
                        if (mode === 'summary') {
                            Papa.parse(file, {
                                header: true,
                                skipEmptyLines: true,
                                complete: async (fullResults) => {
                                    const originalData = fullResults.data;

                                    const remappedData = originalData.map(row => {
                                        const newRow = {};
                                        for (const standardKey in userMap) {
                                            const originalKey = userMap[standardKey];
                                            newRow[standardKey] = row[originalKey];
                                        }
                                        return newRow;
                                    });

                                    let datasetCountry = "Unknown";
                                    if (remappedData.length > 0 && remappedData[0].country) {
                                        datasetCountry = normalizeCountryName(remappedData[0].country);
                                    }
                                    
                                    const newDataset = {
                                        id: Date.now(),
                                        name: name,
                                        type: type,
                                        rows: remappedData.length,
                                        country: datasetCountry, 
                                        createdAt: new Date().toISOString(),
                                        data: remappedData
                                    };
                                    
                                    await saveDatasetToFirestore(newDataset);
                                    selectedDatasetId = newDataset.id;
                                    updateAnalyzeButtonState();
                                    
                                    fileNameDisplay.innerHTML = `Added <span class="font-bold text-purple-400">${name}</span> to repository.`;
                                    mappingModal.classList.add('hidden');
                                    confirmMappingBtn.disabled = false;
                                    confirmMappingBtn.textContent = 'Confirm & Add to Repository';
                                }
                            });
                        } else if (mode === 'weekly') {
                            const reader = new FileReader();
                            reader.onload = async (e) => {
                                const rawData = e.target.result;

                                const newDataset = {
                                    id: Date.now(),
                                    name: name,
                                    type: type,
                                    rows: previewResults.data.length, // Use preview length as approximation
                                    createdAt: new Date().toISOString(),
                                    rawData: rawData, // Save raw data string
                                    isLongFormat: true, 
                                    columnMap: userMap // Save the complete mapping for pivoting later
                                };
                                const savedData = await saveWeeklyDatasetToFirestore(newDataset);
                                if(savedData){
                                    selectedPersistentMemoryDatasetId = savedData.id;
                                }
                                weeklyDataFileNameDisplay.innerHTML = `Added <span class="font-bold text-purple-400">${name}</span> to repository.`;
                                mappingModal.classList.add('hidden');
                                confirmMappingBtn.disabled = false;
                                confirmMappingBtn.textContent = 'Confirm & Add to Repository';
                            };
                            reader.readAsText(file);
                        }
                        // --- End Save Handler Logic ---
                    };
                    confirmMappingBtn.addEventListener('click', currentConfirmHandler);
                }
            });
        }
        
        function intelligentlyMapHeaders(headers, mode) {
            const map = {};
            const usedHeaders = new Set();
            let mappingList;

            if (mode === 'summary') {
                mappingList = SUMMARY_INPUT_MAPPING_FIELDS;
            } else if (mode === 'weekly') {
                 // Use all fields for guessing, including the week_column helper field
                mappingList = [...WEEKLY_DATA_MAPPING_FIELDS];
            } else {
                return map;
            }
            
            const normalizedHeaders = headers.map(h => ({ original: h, normalized: h.toLowerCase().replace(/[\s\(\)_/]/g, '') }));

            const patternsMap = {
                'campaign': ['campaign', 'experimentname', 'experiment'],
                'country': ['country', 'market'],
                'age': ['age', 'audience'],
                'value_type': ['valuetype', 'type', 'metric'],
                'slice': ['slice', 'slicename'],
                'shorts_dac_sct': ['shortsdacsct', 'value', 'ratio', 'metricvalue'],
                'campaign_start_date': ['campaignstartdate', 'startdate'],
                'campaign_end_date': ['campaignenddate', 'scheduledenddate'],
                'rasta_end_date': ['rastaenddate', 'dataenddate', 'enddate'],
                'stat_sig': ['statsig', 'statisticalsignificance', 'statsig'],
                'week_column': ['week', 'time'], // Patterns for the new 'week_column' field
            };

            mappingList.forEach(m => {
                let foundHeader = null;
                const patterns = patternsMap[m.key] || [];
                const isLongFormatWeekField = m.key === 'week_column' && mode === 'weekly';

                // Priority 1: Find header that EXACTLY matches a pattern
                for (const pattern of patterns) {
                    foundHeader = normalizedHeaders.find(h => !usedHeaders.has(h.original) && h.normalized === pattern);
                    if (foundHeader) break;
                }

                // Priority 2: Find header that INCLUDES a pattern (fallback)
                if (!foundHeader) {
                    for (const pattern of patterns) {
                        foundHeader = normalizedHeaders.find(h => !usedHeaders.has(h.original) && h.normalized.includes(pattern));
                        if (foundHeader) break;
                    }
                }
                
                if (foundHeader) {
                    map[m.key] = foundHeader.original;
                    // Only mark used if it's not the weekly identifier check field, as this field just needs to point to *any* relevant column.
                    if (!isLongFormatWeekField) {
                        usedHeaders.add(foundHeader.original);
                    }
                }
            });

            return map;
        }

        // --- Data Repository Functions ---
        function renderRepository() {
            repositoryTabsNav.innerHTML = '';
            repositoryTabsContainer.innerHTML = '';

            const dataInputTab = document.createElement('button');
            dataInputTab.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2 active';
            dataInputTab.textContent = 'Summary Input Repository';
            dataInputTab.dataset.target = 'repo-panel-data-input';
            repositoryTabsNav.appendChild(dataInputTab);

            const persistentMemoryTab = document.createElement('button');
            persistentMemoryTab.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            persistentMemoryTab.textContent = 'Weekly Data Repository';
            persistentMemoryTab.dataset.target = 'repo-panel-persistent-memory';
            repositoryTabsNav.appendChild(persistentMemoryTab);

            const pauseReliveTab = document.createElement('button');
            pauseReliveTab.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            pauseReliveTab.textContent = 'Pause/Relive Repository';
            pauseReliveTab.dataset.target = 'repo-panel-pause-relive';
            repositoryTabsNav.appendChild(pauseReliveTab);

            const dataInputPanel = document.createElement('div');
            dataInputPanel.id = 'repo-panel-data-input';
            dataInputPanel.className = 'repo-tab-panel space-y-2 mt-4';
            const allDatasets = Object.values(localDataRepository).flat();

            if (allDatasets.length === 0) {
                dataInputPanel.innerHTML = `<p class="text-sm text-slate-400 py-4 text-center">No datasets added yet.</p>`;
            } else {
                 allDatasets.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(dataset => {
                    const item = document.createElement('div');
                    item.className = `repo-item flex justify-between items-center p-3 border border-slate-700 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-700/50 border-l-4 ${selectedDatasetId == dataset.id ? 'selected' : 'border-transparent'}`;
                    item.dataset.id = dataset.id;
                    item.innerHTML = `
                        <div>
                            <p class="font-semibold text-slate-200">${dataset.name} <span class="text-xs text-slate-500 font-normal">(${dataset.country})</span></p>
                            <p class="text-xs text-slate-400">${dataset.rows} rows | Source: ${dataset.type}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <button data-id="${dataset.id}" class="select-repo-item-btn text-sm font-semibold text-purple-400 hover:text-purple-300">Select</button>
                            <button data-id="${dataset.id}" class="delete-repo-item-btn text-slate-500 hover:text-red-400 text-2xl leading-none">&times;</button>
                        </div>
                    `;
                    dataInputPanel.appendChild(item);
                });
            }
            repositoryTabsContainer.appendChild(dataInputPanel);

            const persistentMemoryPanel = document.createElement('div');
            persistentMemoryPanel.id = 'repo-panel-persistent-memory';
            persistentMemoryPanel.className = 'repo-tab-panel space-y-2 mt-4 hidden';

            if (localPersistentMemoryRepository.length === 0) {
                 persistentMemoryPanel.innerHTML = `<p class="text-sm text-slate-400 py-4 text-center">No weekly data files added yet.</p>`;
            } else {
                localPersistentMemoryRepository.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(dataset => {
                    const item = document.createElement('div');
                    item.className = `persistent-memory-repo-item flex justify-between items-center p-3 border border-slate-700 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-700/50 border-l-4 ${selectedPersistentMemoryDatasetId == dataset.id ? 'selected' : 'border-transparent'}`;
                    item.dataset.id = dataset.id;
                    item.innerHTML = `
                        <div>
                            <p class="font-semibold text-slate-200">${dataset.name}</p>
                            <p class="text-xs text-slate-400">${dataset.rows} rows | Source: ${dataset.type}</p>
                        </div>
                         <div class="flex items-center gap-4">
                            <button data-id="${dataset.id}" class="select-persistent-memory-repo-item-btn text-sm font-semibold text-purple-400 hover:text-purple-300">Select</button>
                            <button data-id="${dataset.id}" class="delete-persistent-memory-repo-item-btn text-slate-500 hover:text-red-400 text-2xl leading-none">&times;</button>
                        </div>
                    `;
                    persistentMemoryPanel.appendChild(item);
                });
            }
            repositoryTabsContainer.appendChild(persistentMemoryPanel);

            const pauseRelivePanel = document.createElement('div');
            pauseRelivePanel.id = 'repo-panel-pause-relive';
            pauseRelivePanel.className = 'repo-tab-panel space-y-2 mt-4 hidden';

            if (localPauseReliveRepository.length === 0) {
                 pauseRelivePanel.innerHTML = `<p class="text-sm text-slate-400 py-4 text-center">No Pause/Relive datasets added yet.</p>`;
            } else {
                localPauseReliveRepository.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(dataset => {
                    const item = document.createElement('div');
                    item.className = `pause-repo-item flex justify-between items-center p-3 border border-slate-700 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-700/50 border-l-4 ${selectedPauseReliveDatasetId == dataset.id ? 'selected' : 'border-transparent'}`;
                    item.dataset.id = dataset.id;
                    item.innerHTML = `
                        <div>
                            <p class="font-semibold text-slate-200">${dataset.name}</p>
                            <p class="text-xs text-slate-400">${dataset.rulesCount} rules | Source: ${dataset.type}</p>
                        </div>
                         <div class="flex items-center gap-4">
                            <button data-id="${dataset.id}" class="select-pause-repo-item-btn text-sm font-semibold text-purple-400 hover:text-purple-300">Select</button>
                            <button data-id="${dataset.id}" class="delete-pause-repo-item-btn text-slate-500 hover:text-red-400 text-2xl leading-none">&times;</button>
                        </div>
                    `;
                    pauseRelivePanel.appendChild(item);
                });
            }
            repositoryTabsContainer.appendChild(pauseRelivePanel);
        }

        function updateAnalyzeButtonState() {
            analyzeBtn.disabled = !selectedDatasetId;
        }


        function handleRepoTabClick(e) {
            if (e.target.matches('.tab-btn')) {
                const targetPanelId = e.target.dataset.target;
                repositoryTabsNav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                repositoryTabsContainer.querySelectorAll(':scope > .repo-tab-panel').forEach(panel => {
                    panel.classList.toggle('hidden', panel.id !== targetPanelId);
                });
            }
        }

        function handleRepositoryContainerClick(e) {
            const selectRepoBtn = e.target.closest('.select-repo-item-btn');
            const selectPauseRepoBtn = e.target.closest('.select-pause-repo-item-btn');
            const selectPersistentMemoryRepoBtn = e.target.closest('.select-persistent-memory-repo-item-btn');

            if (e.target.matches('.delete-repo-item-btn')) {
                e.stopPropagation();
                showConfirmModal("Are you sure you want to remove this dataset?", () => {
                    deleteDatasetFromFirestore(e.target.dataset.id);
                });
            } else if (e.target.matches('.delete-pause-repo-item-btn')) {
                 e.stopPropagation();
                 showConfirmModal("Are you sure you want to remove this Pause/Relive file?", () => {
                    deletePauseReliveDatasetFromFirestore(e.target.dataset.id);
                });
            } else if (e.target.matches('.delete-persistent-memory-repo-item-btn')) {
                e.stopPropagation();
                showConfirmModal("Are you sure you want to remove this Weekly Data file?", () => {
                    deletePersistentMemoryDatasetFromFirestore(e.target.dataset.id);
                });
            } else if (selectRepoBtn) {
                selectedDatasetId = selectRepoBtn.dataset.id;
                const allDatasets = Object.values(localDataRepository).flat();
                const selected = allDatasets.find(d => d.id === selectedDatasetId);
                if (selected) {
                    fileNameDisplay.innerHTML = `Selected: <span class="font-bold text-purple-400">${selected.name}</span>`;
                }
                updateAnalyzeButtonState();
                renderRepository(); 
            } else if (selectPauseRepoBtn) {
                selectedPauseReliveDatasetId = selectPauseRepoBtn.dataset.id;
                const selected = localPauseReliveRepository.find(d => d.id === selectedPauseReliveDatasetId);
                if (selected) {
                    pauseFileNameDisplay.innerHTML = `Selected: <span class="font-bold text-purple-400">${selected.name}</span>`;
                }
                updateAnalyzeButtonState();
                renderRepository();
            } else if (selectPersistentMemoryRepoBtn) {
                selectedPersistentMemoryDatasetId = selectPersistentMemoryRepoBtn.dataset.id;
                const selected = localPersistentMemoryRepository.find(d => d.id === selectedPersistentMemoryDatasetId);
                if (selected) {
                    weeklyDataFileNameDisplay.innerHTML = `Selected: <span class="font-bold text-purple-400">${selected.name}</span>`;
                }
                renderRepository();
            }
        }

        repositoryTabsNav.addEventListener('click', handleRepoTabClick);
        repositoryTabsContainer.addEventListener('click', handleRepositoryContainerClick);

        // --- Data & Display Functions ---
        function downloadResults() {
            if (!lastResults || lastResults.length === 0) return;
            const headers = ['Country', 'Audience', 'Campaign', 'Slice', 'DAC-SCT', 'Stat Sig'];
            const rows = lastResults.map(r => [`"${r.country}"`, `"${r.audience}"`, `"${r.name}"`, `"${r.slice}"`, `"${r.dac_sct}"`, `"${r.stat_sig}"`].join(','));
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `campaign_data_summary.csv`;
            link.click();
        }

        function getCampaignSliceId(campaign) {
            const idString = `${campaign.name}|${campaign.slice}|${campaign.market}`;
            try {
                 return btoa(unescape(encodeURIComponent(idString)));
            } catch (e) {
                console.error("Failed to encode ID:", idString, e);
                return idString.replace(/[^a-zA-Z0-9]/g, '');
            }
        }

        function applyRecommendationStyles(row, action) {
            row.classList.remove('recco-row-pause', 'recco-row-upbid', 'recco-row-review');
            if (action.includes('PAUSE')) {
                row.classList.add('recco-row-pause');
            } else if (action.includes('UPBID')) {
                row.classList.add('recco-row-upbid');
            } else if (action.includes('REVIEW')) {
                row.classList.add('recco-row-review');
            }
        }

        function getRecoClass(action) {
            if (action.includes('PAUSE')) return 'recco-pause';
            if (action.includes('UPBID')) return 'recco-upbid';
            if (action.includes('REVIEW')) return 'recco-review';
            return 'recco-maintain';
        };

        function renderOptimisationRowContent(row, campaign, userOverride, effectiveAction, isEditMode) {
            const finalAction = userOverride ? userOverride.action : effectiveAction.action;
            
            // Reset styles and apply current ones
            row.className = 'border-b border-slate-700 transition-colors duration-200';
            applyRecommendationStyles(row, finalAction);
            if (userOverride) row.classList.add('recco-row-overridden');
            if (userOverride && userOverride.action === 'DELETED') {
                row.classList.add('hidden');
                return;
            }

            const displayName = (userOverride && userOverride.name) ? userOverride.name : campaign.name;
            const displaySlice = (userOverride && userOverride.slice) ? userOverride.slice : campaign.slice;
            const displaySegment = userOverride ? userOverride.segment : (effectiveAction.segment || '18-34');
            const displayDaysLive = campaign.daysLive;
            const displayReco = finalAction;
            
            const rawReason = String(effectiveAction.reason || ''); // Defensive string casting
            const displayReason = userOverride 
                ? userOverride.reason 
                : (rawReason.startsWith('BENCHMARK_BREACH') 
                    ? `Value (${parseFloat(rawReason.split('|')[1]).toFixed(2)}%) is below benchmark (${parseFloat(rawReason.split('|')[2]).toFixed(2)}%).` 
                    : rawReason); // Use rawReason here
            

            if (isEditMode) {
                row.innerHTML = `
                    <td class="p-3 align-top">
                        <input type="text" value="${displayName}" class="campaign-name-input w-full bg-slate-700 border border-slate-600 rounded-md text-sm p-1 mb-1 font-semibold">
                        <input type="text" value="${displaySlice}" class="slice-name-input w-full bg-slate-700 border border-slate-600 rounded-md text-xs text-slate-400 p-1">
                    </td>
                    <td class="p-3 align-top text-center">
                        <input type="text" value="${displaySegment}" class="segment-input w-24 bg-slate-700 border border-slate-600 rounded-md text-sm p-1 text-center">
                    </td>
                    <td class="p-3 align-top text-center">
                        <input type="number" value="${displayDaysLive}" class="days-live-input w-20 bg-slate-700 border border-slate-600 rounded-md text-sm p-1 text-center">
                    </td>
                    <td class="p-3 align-top">
                        <select class="reco-select w-full bg-slate-700 border border-slate-600 rounded-md text-sm p-1">
                            ${['PAUSE', 'UPBID', 'MAINTAIN', 'REVIEW: Abnormality'].map(opt => `<option value="${opt}" ${opt === displayReco ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </td>
                    <td class="p-3 align-top">
                        <textarea class="reason-textarea w-full bg-slate-700 border border-slate-600 rounded-md text-sm p-2" rows="3">${displayReason}</textarea>
                    </td>
                    <td class="p-3 align-top text-center space-y-2">
                        <button class="save-row-btn w-full text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold py-1 px-3 rounded-lg transition-colors">Save</button>
                        <button class="cancel-edit-btn w-full text-xs bg-slate-600 hover:bg-slate-500 text-white font-semibold py-1 px-3 rounded-lg transition-colors">Cancel</button>
                    </td>
                    <td class="p-3 align-top text-center"></td>
                `;
            } else {
                const recoClass = getRecoClass(displayReco); // Using the now globally available function

                row.innerHTML = `
                    <td class="p-3 align-top"><p class="font-semibold text-slate-200">${displayName}</p><p class="text-xs text-slate-400">${displaySlice}</p></td>
                    <td class="p-3 align-top text-center"><p>${displaySegment}</p></td>
                    <td class="p-3 align-top text-center"><p>${displayDaysLive}</p></td>
                    <td class="p-3 align-top"><span class="font-bold ${recoClass}">${displayReco}</span></td>
                    <td class="p-3 align-top text-sm"><p>${displayReason}</p></td>
                    <td class="p-3 align-top text-center space-y-2">
                        <button class="edit-row-btn w-full text-blue-400 hover:bg-blue-900/50 p-1 rounded-lg transition-colors" title="Edit recommendation">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                        </button>
                        <button class="deep-dive-btn w-full text-teal-400 hover:bg-teal-900/50 p-1 rounded-lg transition-colors" title="Get AI Deep Dive">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0110 4a3 3 0 012.598 4.5 1 1 0 11-1.73 1A1 1 0 0010 8a1 1 0 00-1 1v1a1 1 0 102 0v-1.5a1 1 0 00-1-1 1 1 0 00-.867.5zM10 12a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" /></svg>
                        </button>
                        <button class="delete-row-btn w-full text-red-400 hover:bg-red-900/50 p-1 rounded-lg transition-colors" title="Hide this recommendation">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                        </button>
                    </td>
                    <td class="p-3 align-top text-center">
                         <button class="copy-row-btn text-slate-400 hover:text-purple-400 p-1 rounded-md transition-colors" title="Copy row data">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 pointer-events-none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </td>
                `;

                const actionCell = row.cells[5];
                if (userOverride) {
                    const revertBtn = document.createElement('button');
                    revertBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`;
                    revertBtn.className = 'revert-btn w-full text-blue-400 hover:bg-blue-900/50 p-1 rounded-lg transition-colors';
                    revertBtn.title = 'Revert to AI suggestion';
                    actionCell.insertBefore(revertBtn, actionCell.children[2]);
                    
                    const overrideNotice = document.createElement('div');
                    overrideNotice.className = 'text-xs text-amber-400 mt-1 override-notice';
                    overrideNotice.textContent = `Edited`;
                    actionCell.appendChild(overrideNotice);
                }
            }
        }

        function createOptimisationTable(processedCampaigns) {
            const campaignMap = new Map(processedCampaigns.map(c => [getCampaignSliceId(c), c]));
            const liveCampaigns = processedCampaigns.filter(c => !c.isEnded);
            const container = document.createElement('div');
            container.className = 'space-y-4';
            const groupedByCountry = liveCampaigns.reduce((acc, campaign) => {
                const country = campaign.market.charAt(0).toUpperCase() + campaign.market.slice(1);
                if (!acc[country]) { acc[country] = []; }
                acc[country].push(campaign);
                return acc;
            }, {});

            const countryOrder = ['India', 'Indonesia', 'Japan', 'South Korea'];

            countryOrder.forEach(country => {
                const liveCampaignsInCountry = groupedByCountry[country];
                if (!liveCampaignsInCountry) return;

                const countryDetails = document.createElement('details');
                countryDetails.open = true;
                countryDetails.className = 'border border-slate-700 rounded-lg p-4';
                const countrySummary = document.createElement('summary');
                countrySummary.className = 'flex justify-between items-center font-bold cursor-pointer text-slate-200 text-lg -m-4 p-4';
                const summaryTitle = document.createElement('span');
                summaryTitle.textContent = country;
                countrySummary.appendChild(summaryTitle);
                countryDetails.appendChild(countrySummary);

                const detailsContent = document.createElement('div');
                detailsContent.className = 'details-content space-y-4 mt-4';
                
                const table = document.createElement('table');
                table.className = 'min-w-full text-sm';
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr class="border-b border-slate-700">
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell w-1/4">Campaign & Slice</th>
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell">Age Segment</th>
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell">Days Live</th>
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell">Recommendation</th>
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell w-2/4">Justification</th>
                        <th class="p-3 text-left font-bold uppercase tracking-wider table-header-cell">Actions</th>
                        <th class="p-3 text-center font-bold uppercase tracking-wider table-header-cell">Copy</th>
                    </tr>`;
                table.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                tbody.id = `optimisation-tbody-${country}`;
                let rowsAdded = false;

                const groupedByName = liveCampaignsInCountry.reduce((acc, campaign) => {
                    if (!acc[campaign.name]) { acc[campaign.name] = []; }
                    acc[campaign.name].push(campaign);
                    return acc;
                }, {});

                for (const campaignName in groupedByName) {
                    let campaignSlices = groupedByName[campaignName];
                    const firstSliceInstance = campaignSlices[0];

                    if (firstSliceInstance.isTooNew) {
                        rowsAdded = true;
                        const row = tbody.insertRow();
                        row.className = 'border-b border-slate-700';
                        row.innerHTML = `
                            <td class="p-3 align-top"><p class="font-semibold text-slate-200">${campaignName}</p><p class="text-xs text-slate-400">(All Slices)</p></td>
                            <td class="p-3 align-top text-center">18-34</td>
                            <td class="p-3 align-top text-center">${firstSliceInstance.daysLive}</td>
                            <td class="p-3 align-top"><span class="font-bold recco-maintain">MAINTAIN</span></td>
                            <td class="p-3 align-top text-sm">Wait for at least 7 days of data.</td>
                            <td class="p-3 align-top"></td>
                            <td class="p-3 align-top"></td>`;
                        continue;
                    }
                    
                    campaignSlices.forEach(campaign => {
                        if (!SUMMARY_TAB_SLICES.includes(campaign.slice)) {
                            return;
                        }

                        const campaignId = getCampaignSliceId(campaign);
                        const userOverride = recommendationOverrides[campaignId];
                        let effectiveAction = userOverride ? { ...userOverride } : campaign.aiRecommendation;

                        if (effectiveAction && effectiveAction.action !== 'MAINTAIN') {
                             const segmentsToCheck = ['18-34', effectiveAction.segment].filter(Boolean);
                             const isPausedByRule = segmentsToCheck.some(seg => getAppliedRule(campaign.market, seg, campaign.slice, campaign.name)?.action === 'PAUSE');

                            if (!isPausedByRule) {
                                rowsAdded = true;
                                const row = tbody.insertRow();
                                row.dataset.originalCampaignId = campaignId;
                                renderOptimisationRowContent(row, campaign, userOverride, effectiveAction, false);
                            }
                        }
                    });
                }
                
                table.appendChild(tbody);
                
                tbody.addEventListener('click', (e) => {
                    const button = e.target.closest('button');
                    if (!button) return;
                    
                    const row = button.closest('tr');
                    if (!row) return;

                    const campaignId = row.dataset.originalCampaignId;
                    const isNewRow = row.dataset.isNew === 'true';

                    const campaign = isNewRow ? {} : campaignMap.get(campaignId);
                    if (!campaign && !isNewRow) return;

                    let userOverride = recommendationOverrides[campaignId];
                    let effectiveAction = userOverride || campaign.aiRecommendation;

                    if (button.classList.contains('edit-row-btn')) {
                        renderOptimisationRowContent(row, campaign, userOverride, effectiveAction, true);
                    } else if (button.classList.contains('cancel-edit-btn')) {
                        if (isNewRow) {
                            row.remove();
                        } else {
                            renderOptimisationRowContent(row, campaign, userOverride, effectiveAction, false);
                        }
                    } else if (button.classList.contains('save-row-btn')) {
                        const newCampaignName = row.querySelector('.campaign-name-input').value.trim();
                        const newSliceName = row.querySelector('.slice-name-input').value.trim();
                        
                        if (!newCampaignName || !newSliceName) {
                            showInfoModal("Campaign and Slice names are required.", "Error");
                            return;
                        }
                        
                        const newId = btoa(unescape(encodeURIComponent(`${newCampaignName}|${newSliceName}|${country.toLowerCase()}`)));
                        
                        const overrideData = {
                            name: newCampaignName,
                            slice: newSliceName,
                            action: row.querySelector('.reco-select').value,
                            reason: row.querySelector('.reason-textarea').value,
                            segment: row.querySelector('.segment-input').value.trim() || '18-34',
                            updatedAt: new Date().toISOString(),
                            user: userId.substring(0, 6)
                        };

                        recommendationOverrides[newId] = overrideData;
                        saveOrDeleteOverride(newId, overrideData);
                        showInfoModal("Recommendation saved.", "Saved");

                        const savedCampaignData = { name: newCampaignName, slice: newSliceName, market: country, daysLive: row.querySelector('.days-live-input').value };
                        
                        // --- FIX: Update the campaignMap to allow for subsequent edits ---
                        const originalCampaign = campaignMap.get(campaignId); // Get the original full campaign object
                        // Create an updated object, merging the full original object with the new simple data
                        const updatedCampaign = { ...(originalCampaign || {}), ...savedCampaignData }; 
                        
                        if (campaignId !== newId && campaignMap.has(campaignId)) {
                            campaignMap.delete(campaignId); // Clean up the old ID if it changed
                        }
                        campaignMap.set(newId, updatedCampaign); // Add the new/updated campaign to the map
                        // --- END OF FIX ---

                        row.dataset.originalCampaignId = newId;
                        row.removeAttribute('data-is-new');
                        
                        renderOptimisationRowContent(row, updatedCampaign, overrideData, overrideData, false); // Use updatedCampaign

                    } else if (button.classList.contains('delete-row-btn')) {
                        showConfirmModal("This will hide the recommendation. You can restore it later. Are you sure?", () => {
                             const deleteOverride = { action: 'DELETED', reason: 'User hidden', updatedAt: new Date().toISOString() };
                             recommendationOverrides[campaignId] = deleteOverride;
                             saveOrDeleteOverride(campaignId, deleteOverride);
                             row.classList.add('hidden');
                        });
                    } else if (button.classList.contains('revert-btn')) {
                        showConfirmModal("Revert this recommendation to the original AI suggestion?", () => {
                            delete recommendationOverrides[campaignId];
                            saveOrDeleteOverride(campaignId, null);
                            renderOptimisationRowContent(row, campaign, null, campaign.aiRecommendation, false);
                            showInfoModal('Reverted to original AI suggestion.', 'Reverted');
                        });
                    } else if (button.classList.contains('deep-dive-btn')) {
                        generateDeepDiveForCampaign(campaign);
                    }
                });


                const tfoot = document.createElement('tfoot');
                tfoot.innerHTML = `
                    <tr><td colspan="7" class="p-2 text-center">
                        <button class="add-row-btn w-full text-sm font-semibold text-slate-300 hover:bg-slate-700/50 border-2 border-dashed border-slate-600 rounded-lg py-2 transition-colors">+ Add New Recommendation Row</button>
                    </td></tr>`;
                tfoot.querySelector('.add-row-btn').onclick = () => {
                    const newRow = tbody.insertRow(0); // Insert at the top
                    newRow.dataset.isNew = 'true';
                    renderOptimisationRowContent(newRow, {name: '', slice: '', daysLive: 0, market: country.toLowerCase()}, null, {action: 'MAINTAIN', reason: '', segment: '18-34'}, true);
                };
                table.appendChild(tfoot);

                if (!rowsAdded) {
                     detailsContent.innerHTML = `<p class="text-sm text-slate-400">No specific optimisations proposed for campaigns in ${country} at this time.</p>`;
                } else {
                     detailsContent.appendChild(table);
                }
                countryDetails.appendChild(detailsContent);
                
                const revertAllBtn = document.createElement('button');
                revertAllBtn.textContent = 'Revert All Edits';
                revertAllBtn.className = 'revert-all-btn text-xs bg-slate-600 hover:bg-slate-500 text-slate-300 font-semibold py-1 px-2 rounded-md transition-colors';
                revertAllBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    revertAllForCountry(country, tbody.id, campaignMap);
                };
                countrySummary.appendChild(revertAllBtn);

                container.appendChild(countryDetails);
            });

            if (container.children.length === 0) {
                container.innerHTML = (liveCampaigns.length > 0) ? `<p class="text-slate-400 text-sm font-medium mt-4 text-center">No actionable optimisations proposed across all markets.</p>` : `<p class="text-slate-400 text-sm font-medium mt-4 text-center">No optimisations proposed. All campaigns have ended.</p>`;
            }
            return container;
        }

        function createStatSigTable(data) {
            const tableWrapper = document.createElement('div');
            tableWrapper.className = 'table-container rounded-lg overflow-auto';
            const table = document.createElement('table');
            table.className = 'min-w-full text-sm';
            const thead = document.createElement('thead');
            thead.className = 'table-sticky-head sticky top-0 backdrop-blur-sm';
            const tbody = document.createElement('tbody');
            tbody.className = 'divide-y divide-slate-700';
            thead.innerHTML = `<tr><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Country</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Campaign</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Slice</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Audience</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Days Live</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">DAC-SCT</th><th scope="col" class="px-4 py-2 text-left font-bold uppercase tracking-wider table-header-cell">Stat Sig</th></tr>`;
            data.forEach(item => {
                const row = document.createElement('tr');
                row.className = 'result-row';
                const statSigClass = item.stat_sig === 'Positive' ? 'stat-sig-positive' : item.stat_sig === 'Negative' ? 'stat-sig-negative' : 'stat-sig-neutral';
                row.innerHTML = `<td class="px-4 py-2 whitespace-nowrap">${item.country}</td><td class="px-4 py-2 whitespace-nowrap">${item.name}</td><td class="px-4 py-2 whitespace-nowrap">${item.slice}</td><td class="px-4 py-2 whitespace-nowrap">${item.audience}</td><td class="px-4 py-2 whitespace-nowrap text-center">${item.daysLive}</td><td class="px-4 py-2 whitespace-nowrap font-semibold ${statSigClass}">${item.dac_sct}</td><td class="px-4 py-2 whitespace-nowrap font-semibold ${statSigClass}">${item.stat_sig}</td>`;
                tbody.appendChild(row);
            });
            table.appendChild(thead);
            table.appendChild(tbody);
            tableWrapper.appendChild(table);
            return tableWrapper;
        }

        /**
         * Converts long format weekly campaign data into a pivoted structure for display.
         * @param {string} rawData 
         * @param {object} columnMap 
         * @returns {object} { pivotedByCountry: object, allWeekHeaders: Array<string> }
         */
        function pivotWeeklyData(rawData, columnMap) {
            const parsedData = Papa.parse(rawData, { header: true, skipEmptyLines: true }).data;
            const grouped = {}; // Key: Country|Age|Campaign|Slice -> Value: {Week1: {value: 1.2, sig: 'NA'}, ...}
            const uniqueWeeks = new Set();
            
            // Map column keys using the saved map
            const DAC_SCT_COL = columnMap.shorts_dac_sct;
            const WEEK_COL = columnMap.week_column; // The name of the column containing 'Week1', 'Week2', etc.
            const VALUE_TYPE_COL = columnMap.value_type;
            const CAMPAIGN_COL = columnMap.campaign;
            const SLICE_COL = columnMap.slice;
            const COUNTRY_COL = columnMap.country;
            const AGE_COL = columnMap.age;
            const STAT_SIG_COL = columnMap.stat_sig;

            parsedData.forEach(row => {
                const country = normalizeCountryName(row[COUNTRY_COL]?.trim());
                const age = row[AGE_COL]?.trim();
                const campaign = row[CAMPAIGN_COL]?.trim();
                const slice = row[SLICE_COL]?.trim();
                const valueType = row[VALUE_TYPE_COL]?.trim().toLowerCase();
                const dacSct = row[DAC_SCT_COL];
                const weekId = row[WEEK_COL]?.trim(); // Use the mapped 'Week' column name
                const statSigValue = row[STAT_SIG_COL]?.trim() || 'Neutral';

                
                // Only process ratio data and relevant slices
                if (valueType === 'ratio (%)' && SUMMARY_TAB_SLICES.includes(slice) && campaign && age && country) {
                    const key = `${country}|${age}|${campaign}|${slice}`;
                    
                    if (!grouped[key]) {
                        grouped[key] = {
                            country,
                            age,
                            campaign,
                            slice,
                            weeks: {}
                        };
                    }
                    if (dacSct !== undefined && dacSct !== null && dacSct !== '' && weekId) {
                        grouped[key].weeks[weekId] = {
                            value: parseFloat(dacSct).toFixed(2), // Store the formatted value
                            sig: interpretStatSigValue(statSigValue) // Interpret the Stat Sig
                        };
                        uniqueWeeks.add(weekId);
                    }
                }
            });

            // Sort weeks numerically (Week1, Week2, Week10)
            const allWeekHeaders = Array.from(uniqueWeeks).sort((a, b) => {
                const numA = parseInt(a.match(/\d+/)?.[0] || 0);
                const numB = parseInt(b.match(/\d+/)?.[0] || 0);
                return numA - numB;
            });
            
            // Reformat the grouped data for easy rendering
            const pivotedData = Object.values(grouped).map(item => {
                const row = { country: item.country, age: item.age, campaign: item.campaign, slice: item.slice };
                allWeekHeaders.forEach(week => {
                    // Store the entire object or a default placeholder
                    row[week] = item.weeks[week] || { value: '-', sig: 'Neutral' };
                });
                return row;
            });

            const pivotedByCountry = pivotedData.reduce((acc, row) => {
                if (!acc[row.country]) acc[row.country] = {};
                if (!acc[row.country][row.age]) acc[row.country][row.age] = [];
                acc[row.country][row.age].push(row);
                return acc;
            }, {});

            return { pivotedByCountry, allWeekHeaders };
        }


        function displayRecommendations(processedCampaigns, weeklyRawData, weeklyColumnMap) {
            const tablesContainer = document.getElementById('tables-container');
            tabsNav.innerHTML = '';
            tablesContainer.innerHTML = '';
            lastResults = [];
            
            let pivotedWeeklyData = { pivotedByCountry: {}, allWeekHeaders: [] };
            let weeklyDataError = null;

            if (weeklyRawData && weeklyColumnMap) {
                try {
                    pivotedWeeklyData = pivotWeeklyData(weeklyRawData, weeklyColumnMap);
                } catch(e) {
                    weeklyDataError = `Failed to process Weekly Data: ${e.message}`;
                    console.error("Weekly Data Pivoting Error:", e);
                }
            }


            if (!processedCampaigns || processedCampaigns.length === 0) {
                placeholderResult.classList.remove('hidden');
                resultContainer.classList.add('hidden');
                tablesContainer.innerHTML = `<p class="text-slate-400 text-sm font-medium mt-4">No campaign data found in the file.</p>`;
                return;
            }

            // Prepare data for the Summary tab
            const allTableData = [];
            processedCampaigns.forEach(campaign => {
                ['18-34', '18-24', '25-34'].forEach(audience => {
                    const audienceKey = (audience === '18-34') ? 'audience_18_34' : `sub_audience_${audience.replace('-', '_')}`;
                    const dacSctValue = campaign.latest_week_data[`${audienceKey}_value`];
                    const statSigValue = campaign.latest_week_data[`${audienceKey}_stat_sig`];
                    if (dacSctValue !== undefined) {
                        allTableData.push({
                            country: campaign.market.charAt(0).toUpperCase() + campaign.market.slice(1),
                            audience, name: campaign.name, slice: campaign.slice || 'N/A',
                            dac_sct: typeof dacSctValue === 'number' ? dacSctValue.toFixed(2) : 'N/A',
                            stat_sig: statSigValue || 'Neutral',
                            daysLive: campaign.daysLive
                        });
                    }
                });
            });
            const filteredTableData = allTableData.filter(d => SUMMARY_TAB_SLICES.includes(d.slice));
            lastResults = filteredTableData;

            // --- Create Tabs ---
            const summaryTabBtn = document.createElement('button');
            summaryTabBtn.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2 active';
            summaryTabBtn.textContent = 'Summary';
            summaryTabBtn.dataset.target = 'summary-panel';
            tabsNav.appendChild(summaryTabBtn);

            const weeklyDataTabBtn = document.createElement('button');
            weeklyDataTabBtn.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            weeklyDataTabBtn.textContent = 'Weekly Campaign Data';
            weeklyDataTabBtn.dataset.target = 'weekly-data-panel';
            tabsNav.appendChild(weeklyDataTabBtn);

            const statSigTabBtn = document.createElement('button');
            statSigTabBtn.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            statSigTabBtn.textContent = 'Stat Sig Slices';
            statSigTabBtn.dataset.target = 'stat-sig-panel';
            tabsNav.appendChild(statSigTabBtn);
            
            const optimisationTabBtn = document.createElement('button');
            optimisationTabBtn.className = 'tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            optimisationTabBtn.textContent = 'Proposed Decisions';
            optimisationTabBtn.dataset.target = 'optimisation-panel';
            tabsNav.appendChild(optimisationTabBtn);

            // --- Summary Panel ---
            const summaryPanel = document.createElement('div');
            summaryPanel.id = 'summary-panel';
            summaryPanel.className = 'tab-panel';
            tablesContainer.appendChild(summaryPanel);
            const countryTabsNav = document.createElement('div');
            countryTabsNav.className = 'flex border-b border-slate-700 country-tabs-nav';
            summaryPanel.appendChild(countryTabsNav);
            const countryTablesContainer = document.createElement('div');
            countryTablesContainer.id = 'country-tables-container';
            countryTablesContainer.className = 'mt-4 country-tables-container';
            summaryPanel.appendChild(countryTablesContainer);
            
            ['India', 'Indonesia', 'Japan', 'South Korea'].forEach((country, index) => {
                const tabBtn = document.createElement('button');
                tabBtn.className = `country-tab-btn tab-btn py-2 px-4 text-sm font-semibold border-b-2 ${index === 0 ? 'active' : ''}`;
                tabBtn.textContent = country;
                tabBtn.dataset.target = `country-tab-panel-${country.replace(/\s+/g, '-')}`;
                countryTabsNav.appendChild(tabBtn);

                const tabPanel = document.createElement('div');
                tabPanel.id = `country-tab-panel-${country.replace(/\s+/g, '-')}`;
                tabPanel.className = `country-tab-panel ${index > 0 ? 'hidden' : ''}`;
                
                const countryData = filteredTableData.filter(d => d.country.toLowerCase() === country.toLowerCase());
                if (countryData.length > 0) {
                    ['18-34', '18-24', '25-34'].forEach(audience => {
                        const audienceData = countryData.filter(d => d.audience === audience);
                        if (audienceData.length > 0) {
                            const uniqueSlices = [...new Set(audienceData.map(d => d.slice))].sort((a, b) => SUMMARY_TAB_SLICES.indexOf(a) - SUMMARY_TAB_SLICES.indexOf(b));
                            if (uniqueSlices.length === 0) return;

                            const audienceTitle = document.createElement('h4');
                            audienceTitle.className = 'text-lg font-bold mt-6 mb-2 text-slate-100';
                            audienceTitle.textContent = `Audience: ${audience}`;
                            tabPanel.appendChild(audienceTitle);
                            const uniqueCampaigns = [...new Set(audienceData.map(d => d.name))].sort();
                            const tableWrapper = document.createElement('div');
                            tableWrapper.className = 'table-container rounded-lg overflow-auto';
                            const table = document.createElement('table');
                            table.className = 'min-w-full text-xs';
                            const thead = document.createElement('thead');
                            thead.className = 'table-sticky-head sticky top-0 backdrop-blur-sm';
                            const tbody = document.createElement('tbody');
                            tbody.className = 'divide-y divide-slate-700';
                            
                            const campaignDetailsList = uniqueCampaigns.map(name => ({
                                name,
                                startDate: processedCampaigns.find(c => c.name === name)?.startDate || 'N/A',
                                endDate: processedCampaigns.find(c => c.name === name)?.rastaEndDate || 'N/A',
                                daysLive: processedCampaigns.find(c => c.name === name)?.daysLive || 'N/A'
                            }));
                            
                            const campaignHeaderRow = document.createElement('tr');
                            const dateHeaderRow = document.createElement('tr');
                            const daysLiveHeaderRow = document.createElement('tr');

                            campaignHeaderRow.innerHTML = `<th scope="col" rowspan="3" class="px-3 py-2 text-left font-bold uppercase tracking-wider table-header-cell sticky left-0 z-10 align-middle">Slice</th>` + uniqueCampaigns.map(c => `<th scope="col" class="px-3 py-2 text-center font-bold uppercase tracking-wider table-header-cell">${c}</th>`).join('');
                            dateHeaderRow.innerHTML = campaignDetailsList.map(d => `<th scope="col" class="px-3 py-1 text-center font-normal text-xs normal-case table-header-cell">${formatDateForDisplay(d.startDate)} to ${formatDateForDisplay(d.endDate)}</th>`).join('');
                            daysLiveHeaderRow.innerHTML = campaignDetailsList.map(d => `<th scope="col" class="px-3 py-1 text-center font-normal text-xs normal-case table-header-cell">(${d.daysLive} days)</th>`).join('');
                            
                            thead.appendChild(campaignHeaderRow);
                            thead.appendChild(dateHeaderRow);
                            thead.appendChild(daysLiveHeaderRow);

                            uniqueSlices.forEach(slice => {
                                let rowHighlightClass = audienceData.some(d => d.slice === slice && d.stat_sig === 'Negative') ? 'negative-row' : audienceData.some(d => d.slice === slice && d.stat_sig === 'Positive') ? 'positive-row' : '';
                                const bodyRow = document.createElement('tr');
                                bodyRow.className = `result-row ${rowHighlightClass}`;
                                let rowHTML = `<td class="sticky-slice-cell px-3 py-2 whitespace-nowrap font-medium align-top sticky left-0 z-10">${slice}</td>`;
                                
                                uniqueCampaigns.forEach(campaign => {
                                    // Helper to check if a slice is effectively NA (due to missing data or a pause rule)
                                    const isSliceEffectivelyNA = (sliceNameToFind) => {
                                        const point = audienceData.find(d => d.slice === sliceNameToFind && d.name === campaign);
                                        const rule = getAppliedRule(country, audience, sliceNameToFind, campaign);
                                        if (rule && rule.action === 'PAUSE') {
                                            return { na: true, rule: rule };
                                        }
                                        if (!point || point.dac_sct === 'N/A') {
                                            return { na: true, rule: null };
                                        }
                                        return { na: false, rule: null };
                                    };

                                    let cellHTML = '';

                                    // Hierarchy check for NA status
                                    const controlStatus = isSliceEffectivelyNA('Control');
                                    if (slice !== 'Control' && controlStatus.na) {
                                        cellHTML = `<td class="px-3 py-2 whitespace-nowrap text-center font-semibold align-middle text-slate-500">NA ${controlStatus.rule ? `<span class="text-xs">(${formatDateForDisplay(controlStatus.rule.date.toISOString())})</span>` : ''}</td>`;
                                    } else {
                                        const medActiveStatus = isSliceEffectivelyNA('Seu3MedActiveControlSlice');
                                        const medAllCamStatus = isSliceEffectivelyNA('HasSctSeuMedAllCamControlSlice');
                                        const highActiveStatus = isSliceEffectivelyNA('Seu3HighActiveControlSlice');
                                        const highAllCamStatus = isSliceEffectivelyNA('HasSctSeuHighAllCamControlSlice');
                                        let isHierarchicallyNA = false;
                                        if ((slice === 'Seu3BroadActiveControlSlice' || slice === 'HasSctSeuBroadAllCamControlSlice') &&
                                            ((medActiveStatus.na && highActiveStatus.na) || (medActiveStatus.na && medAllCamStatus.na && highActiveStatus.na && highAllCamStatus.na))) {
                                            isHierarchicallyNA = true;
                                        }
                                        if (isHierarchicallyNA) {
                                             cellHTML = `<td class="px-3 py-2 whitespace-nowrap text-center font-semibold align-middle text-slate-500">NA</td>`;
                                        }
                                    }

                                    // Direct check or render data
                                    if (!cellHTML) {
                                        const currentSliceStatus = isSliceEffectivelyNA(slice);
                                        if (currentSliceStatus.na) {
                                            cellHTML = `<td class="px-3 py-2 text-center text-slate-400">${currentSliceStatus.rule ? `NA <span class="text-xs">(${formatDateForDisplay(currentSliceStatus.rule.date.toISOString())})</span>` : '-'}</td>`;
                                        } else {
                                            const dataPoint = audienceData.find(d => d.slice === slice && d.name === campaign);
                                            const textClass = dataPoint.stat_sig === 'Positive' ? 'stat-sig-positive' : dataPoint.stat_sig === 'Negative' ? 'stat-sig-negative' : 'stat-sig-neutral';
                                            cellHTML = `<td class="px-3 py-2 whitespace-nowrap text-center font-semibold align-middle"><span class="${textClass}">${dataPoint.dac_sct}</span></td>`;
                                        }
                                    }
                                    rowHTML += cellHTML;
                                });
                                bodyRow.innerHTML = rowHTML;
                                tbody.appendChild(bodyRow);
                            });
                            table.appendChild(thead);
                            table.appendChild(tbody);
                            tableWrapper.appendChild(table);
                            tabPanel.appendChild(tableWrapper);
                        }
                    });
                } else {
                    tabPanel.innerHTML = `<p class="text-slate-400 text-sm font-medium mt-4">No data available for ${country}.</p>`;
                }
                countryTablesContainer.appendChild(tabPanel);
            });

            // --- Weekly Campaign Data Panel (Updated Structure) ---
            const weeklyDataPanel = document.createElement('div');
            weeklyDataPanel.id = 'weekly-data-panel';
            weeklyDataPanel.className = 'tab-panel hidden';
            tablesContainer.appendChild(weeklyDataPanel);

            if (!weeklyRawData || !weeklyColumnMap) {
                weeklyDataPanel.innerHTML = `<p class="text-slate-400 text-sm font-medium mt-4 text-center">No Weekly Data file was selected for this analysis.</p>`;
            } else {
                
                if (weeklyDataError) {
                    weeklyDataPanel.innerHTML = `<p class="text-red-400 text-sm font-medium mt-4 text-center">${weeklyDataError}</p>`;
                } else {
                    const { pivotedByCountry, allWeekHeaders } = pivotedWeeklyData;
                    
                    const weeklyCountryTabsNav = document.createElement('div');
                    weeklyCountryTabsNav.className = 'flex border-b border-slate-700 country-tabs-nav';
                    weeklyDataPanel.appendChild(weeklyCountryTabsNav);

                    const weeklyCountryTablesContainer = document.createElement('div');
                    weeklyCountryTablesContainer.className = 'mt-4 country-tables-container';
                    weeklyDataPanel.appendChild(weeklyCountryTablesContainer);

                    ['India', 'Indonesia', 'Japan', 'South Korea'].forEach((country, countryIndex) => {
                        const countryData = pivotedByCountry[country];
                        
                        const countryTabBtn = document.createElement('button');
                        countryTabBtn.className = `country-tab-btn tab-btn py-2 px-4 text-sm font-semibold border-b-2 ${countryIndex === 0 ? 'active' : ''}`;
                        countryTabBtn.textContent = country;
                        countryTabBtn.dataset.target = `weekly-country-panel-${country.replace(/\s+/g, '-')}`;
                        weeklyCountryTabsNav.appendChild(countryTabBtn);

                        const countryTabPanel = document.createElement('div');
                        countryTabPanel.id = `weekly-country-panel-${country.replace(/\s+/g, '-')}`;
                        countryTabPanel.className = `country-tab-panel ${countryIndex > 0 ? 'hidden' : ''}`;
                        
                        let totalAudienceBlocks = 0;

                        if (countryData) {
                            ['18-34', '18-24', '25-34'].forEach(audience => {
                                const audienceData = countryData[audience];

                                if (audienceData && audienceData.length > 0) {
                                    totalAudienceBlocks++;
                                    
                                    const audienceTitle = document.createElement('h4');
                                    audienceTitle.className = 'text-lg font-bold mt-6 mb-2 text-slate-100';
                                    audienceTitle.textContent = `Audience: ${audience}`;
                                    countryTabPanel.appendChild(audienceTitle);

                                    // Group by Campaign Name
                                    const groupedByCampaign = audienceData.reduce((acc, row) => {
                                        const campaignName = row.campaign;
                                        if (!acc[campaignName]) acc[campaignName] = [];
                                        acc[campaignName].push(row);
                                        return acc;
                                    }, {});

                                    const campaignNames = Object.keys(groupedByCampaign).sort();

                                    const campaignSubTabsNav = document.createElement('div');
                                    campaignSubTabsNav.className = 'flex border-b border-slate-700 campaign-sub-tabs-nav overflow-x-auto whitespace-nowrap';
                                    campaignSubTabsNav.style.paddingBottom = '2px';
                                    countryTabPanel.appendChild(campaignSubTabsNav);

                                    const campaignSubTablesContainer = document.createElement('div');
                                    campaignSubTablesContainer.className = 'mt-4 campaign-sub-tables-container';
                                    countryTabPanel.appendChild(campaignSubTablesContainer);

                                    campaignNames.forEach((campaignName, campaignIndex) => {
                                        const campaignTabBtn = document.createElement('button');
                                        campaignTabBtn.className = `campaign-sub-tab-btn tab-btn py-2 px-4 text-xs font-semibold border-b-2 ${campaignIndex === 0 ? 'active' : ''}`;
                                        campaignTabBtn.textContent = campaignName;
                                        campaignTabBtn.dataset.target = `weekly-campaign-panel-${country.replace(/\s+/g, '-')}-${audience.replace(/\s+/g, '-')}-${campaignName.replace(/[^a-zA-Z0-9]/g, '')}`;
                                        campaignSubTabsNav.appendChild(campaignTabBtn);

                                        const campaignPanel = document.createElement('div');
                                        campaignPanel.id = campaignTabBtn.dataset.target;
                                        campaignPanel.className = `campaign-sub-tab-panel ${campaignIndex > 0 ? 'hidden' : ''}`;

                                        const campaignData = groupedByCampaign[campaignName];
                                        
                                        const tableWrapper = document.createElement('div');
                                        tableWrapper.className = 'table-container rounded-lg overflow-auto';
                                        const table = document.createElement('table');
                                        table.className = 'min-w-full text-xs';
                                        const thead = document.createElement('thead');
                                        thead.className = 'table-sticky-head sticky top-0 backdrop-blur-sm';
                                        const tbody = document.createElement('tbody');
                                        tbody.className = 'divide-y divide-slate-700';

                                        // Create Header Rows
                                        const weekHeaderRow = document.createElement('tr');
                                        weekHeaderRow.innerHTML = `<th class="px-3 py-2 text-left font-bold uppercase tracking-wider table-header-cell sticky left-0 z-10 align-middle">Slice</th>` +
                                                                  allWeekHeaders.map(w => `<th class="px-3 py-1 text-center font-bold uppercase tracking-wider table-header-cell">${w}</th>`).join('');

                                        thead.appendChild(weekHeaderRow);

                                        // Create Body Rows
                                        campaignData.forEach(row => {
                                            const bodyRow = document.createElement('tr');
                                            bodyRow.className = 'result-row';
                                            let rowHTML = `<td class="sticky-slice-cell px-3 py-2 whitespace-nowrap font-medium sticky left-0 z-10">${row.slice}</td>`;

                                            allWeekHeaders.forEach(week => {
                                                const dataPoint = row[week];
                                                const value = dataPoint.value || '-';
                                                const sigClass = dataPoint.sig ? (dataPoint.sig === 'Positive' ? 'stat-sig-positive' : dataPoint.sig === 'Negative' ? 'stat-sig-negative' : 'stat-sig-neutral') : '';
                                                
                                                rowHTML += `<td class="px-3 py-2 whitespace-nowrap text-center font-semibold"><span class="${sigClass}">${value}</span></td>`;
                                            });
                                            bodyRow.innerHTML = rowHTML;
                                            tbody.appendChild(bodyRow);
                                        });
                                        
                                        table.appendChild(thead);
                                        table.appendChild(tbody);
                                        tableWrapper.appendChild(table);
                                        campaignPanel.appendChild(tableWrapper);
                                        campaignSubTablesContainer.appendChild(campaignPanel);
                                    });
                                }
                            });
                        }

                        // Check if data was processed or if the country was just empty
                        if (!countryData || totalAudienceBlocks === 0) {
                            countryTabPanel.innerHTML = `<p class="text-slate-400 text-sm font-medium mt-4 text-center">No weekly trend data available for ${country} with matching summary slices and ratio metrics.</p>`;
                        }
                        
                        weeklyCountryTablesContainer.appendChild(countryTabPanel);
                    });
                }
            }

            // --- Stat Sig Panel ---
            const statSigPanel = document.createElement('div');
            statSigPanel.id = 'stat-sig-panel';
            statSigPanel.className = 'tab-panel hidden';
            const positiveData = filteredTableData.filter(d => d.stat_sig === 'Positive');
            const negativeData = filteredTableData.filter(d => d.stat_sig === 'Negative');
            const statSigTabsNav = document.createElement('div');
            statSigTabsNav.id = 'stat-sig-tabs-nav';
            statSigTabsNav.className = 'flex border-b border-slate-700';
            statSigPanel.appendChild(statSigTabsNav);
            const statSigTablesContainer = document.createElement('div');
            statSigTablesContainer.id = 'stat-sig-tables-container';
            statSigTablesContainer.className = 'mt-4';
            statSigPanel.appendChild(statSigTablesContainer);
            const positiveTabBtn = document.createElement('button');
            positiveTabBtn.className = 'stat-sig-tab-btn tab-btn py-2 px-4 text-sm font-semibold border-b-2 active';
            positiveTabBtn.textContent = `Positive (${positiveData.length})`;
            positiveTabBtn.dataset.target = 'positive-panel';
            statSigTabsNav.appendChild(positiveTabBtn);
            const negativeTabBtn = document.createElement('button');
            negativeTabBtn.className = 'stat-sig-tab-btn tab-btn py-2 px-4 text-sm font-semibold border-b-2';
            negativeTabBtn.textContent = `Negative (${negativeData.length})`;
            negativeTabBtn.dataset.target = 'negative-panel';
            statSigTabsNav.appendChild(negativeTabBtn);
            const positivePanel = document.createElement('div');
            positivePanel.id = 'positive-panel';
            positivePanel.className = 'stat-sig-tab-panel';
            positivePanel.innerHTML = positiveData.length > 0 ? '' : `<p class="text-slate-400 text-sm font-medium mt-4">No positive statistically significant slices found.</p>`;
            if (positiveData.length > 0) positivePanel.appendChild(createStatSigTable(positiveData));
            statSigTablesContainer.appendChild(positivePanel);
            const negativePanel = document.createElement('div');
            negativePanel.id = 'negative-panel';
            negativePanel.className = 'stat-sig-tab-panel hidden';
            negativePanel.innerHTML = negativeData.length > 0 ? '' : `<p class="text-slate-400 text-sm font-medium mt-4">No negative statistically significant slices found.</p>`;
            if (negativeData.length > 0) negativePanel.appendChild(createStatSigTable(negativeData));
            statSigTablesContainer.appendChild(negativePanel);
            tablesContainer.appendChild(statSigPanel);

            // --- Optimisation Panel ---
            const optimisationPanel = document.createElement('div');
            optimisationPanel.id = 'optimisation-panel';
            optimisationPanel.className = 'tab-panel hidden';
            const optimisationHeader = document.createElement('div');
            optimisationHeader.className = 'flex flex-wrap justify-between items-start gap-4 mb-4';
            const noteContainer = document.createElement('div');
            noteContainer.className = 'p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm flex-grow';
            noteContainer.innerHTML = `<p class="text-slate-300 font-medium">Note: Recommendations shown only for summary slices on live campaigns.</p>`;
            optimisationHeader.appendChild(noteContainer);
            
            // AI Summary Control (Button only - toggle removed)
            const aiControlGroup = document.createElement('div');
            aiControlGroup.className = 'flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg';
            
            const aiSummaryButton = document.createElement('button');
            aiSummaryButton.id = 'get-ai-summary-btn';
            aiSummaryButton.className = 'w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex-shrink-0';
            aiSummaryButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span>Get AI Summary</span>`;
            aiControlGroup.appendChild(aiSummaryButton);

            // Copy All Button
            const copyAllButton = document.createElement('button');
            copyAllButton.id = 'copy-all-btn';
            copyAllButton.className = 'w-full sm:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-2 px-4 rounded-lg transition-colors flex-shrink-0';
            copyAllButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy All</span>`;
            copyAllButton.onclick = copyAllDecisions;
            
            const buttonGroup = document.createElement('div');
            buttonGroup.className = 'flex flex-col sm:flex-row items-center gap-2'; 
            buttonGroup.appendChild(copyAllButton);
            
            // Re-adding header element structure (combining elements)
            optimisationHeader.innerHTML = '';
            optimisationHeader.appendChild(noteContainer);
            optimisationHeader.appendChild(aiControlGroup);
            optimisationHeader.appendChild(buttonGroup);


            optimisationPanel.appendChild(optimisationHeader);
            optimisationPanel.appendChild(createOptimisationTable(processedCampaigns));
            tablesContainer.appendChild(optimisationPanel);

            optimisationPanel.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.copy-row-btn');
                if (copyBtn) {
                    const row = copyBtn.closest('tr');
                    const country = row.closest('details').querySelector('summary span').textContent; // Get country from details summary
                    
                    const campaignName = row.cells[0].querySelector('p:first-child')?.textContent || 'N/A';
                    const slice = row.cells[0].querySelector('p:last-child')?.textContent || 'N/A';
                    const ageSegment = row.cells[1].textContent || 'N/A';
                    const daysLive = row.cells[2].textContent || 'N/A';
                    const recommendation = row.cells[3].textContent || 'N/A';
                    const rationale = row.cells[4].textContent || 'N/A';

                    const header = "Campaign Name\tMarket\tSlice\tAge Segment\tDays Live\tRecommendation\tRationale";
                    const dataRow = `${campaignName}\t${country}\t${slice}\t${ageSegment}\t${daysLive}\t${recommendation}\t${rationale}`;
                    const textToCopy = `${header}\n${dataRow}`;

                    const textarea = document.createElement('textarea');
                    textarea.value = textToCopy;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);

                    showInfoModal('Recommendation details copied to clipboard!', 'Copied');
                }
            });

            placeholderResult.classList.add('hidden');
            resultContainer.classList.remove('hidden');
            actionButtons.classList.remove('hidden');
        }

        function copyAllDecisions() {
            const dataToCopy = [];
            const headers = ['Campaign Name', 'Market', 'Slice', 'Age Segment', 'Days Live', 'Recommendation', 'Rationale'];
            dataToCopy.push(headers.join('\t'));

            const countryDetails = document.querySelectorAll('#optimisation-panel details');
            countryDetails.forEach(details => {
                const country = details.querySelector('summary span').textContent;
                const tbody = details.querySelector('tbody');
                if (!tbody) return;
                
                const rows = tbody.querySelectorAll('tr:not(.hidden)'); // Get only visible rows
                
                rows.forEach(row => {
                    let campaignName, sliceName, ageSegment, daysLive, recommendation, justification;
                    
                    const isEditMode = row.querySelector('.campaign-name-input');

                    if (isEditMode) {
                        campaignName = row.querySelector('.campaign-name-input')?.value || '';
                        sliceName = row.querySelector('.slice-name-input')?.value || '';
                        ageSegment = row.querySelector('.segment-input')?.value || '';
                        daysLive = row.querySelector('.days-live-input')?.value || '';
                        recommendation = row.querySelector('.reco-select')?.value || '';
                        justification = row.querySelector('.reason-textarea')?.value || '';
                    } else {
                        campaignName = row.cells[0]?.querySelector('p.font-semibold')?.textContent || '';
                        sliceName = row.cells[0]?.querySelector('p.text-xs')?.textContent || '';
                        ageSegment = row.cells[1]?.textContent || '';
                        daysLive = row.cells[2]?.textContent || '';
                        recommendation = row.cells[3]?.textContent || '';
                        justification = row.cells[4]?.textContent || '';
                    }

                    if (campaignName && sliceName) { // Only copy rows with campaign and slice name
                        dataToCopy.push([campaignName, country, sliceName, ageSegment, daysLive, recommendation, justification].join('\t'));
                    }
                });
            });

            if (dataToCopy.length <= 1) {
                showInfoModal("No recommendations to copy.", "Info");
                return;
            }

            const textToCopy = dataToCopy.join('\n');
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);

            showInfoModal('All proposed decisions copied to clipboard!', 'Copied');
        }

        function revertAllForCountry(country, tbodyId, campaignMap) {
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;

            const rowsToRevert = Array.from(tbody.querySelectorAll('tr[data-original-campaign-id]'));
            let revertedCount = 0;

            rowsToRevert.forEach(row => {
                const originalCampaignId = row.dataset.originalCampaignId;
                if (recommendationOverrides[originalCampaignId]) { // Only revert if it's actually an override
                    const campaign = campaignMap.get(originalCampaignId);
                    if (campaign) {
                        delete recommendationOverrides[originalCampaignId];
                        saveOrDeleteOverride(originalCampaignId, null);
                        renderOptimisationRowContent(row, campaign, null, campaign.aiRecommendation, false);
                        revertedCount++;
                    }
                }
            });

            if (revertedCount > 0) {
                showInfoModal(`Reverted ${revertedCount} recommendation(s) for ${country} to the original AI suggestion.`, 'Reverted');
            } else {
                showInfoModal(`No edited recommendations to revert for ${country}.`, 'Info');
            }
        }

        // --- Benchmark Functions ---
        function renderBenchmarkTable() {
            if (Object.keys(hardcodedBenchmarks).length === 0) {
                benchmarkTableContainer.innerHTML = `<p class="text-sm text-slate-400 text-center py-4">Loading benchmarks...</p>`;
                return;
            }
            const table = document.createElement('table');
            table.className = 'min-w-full text-xs text-left';
            const thead = document.createElement('thead');
            thead.innerHTML = `<tr><th class="px-2 py-1">Market</th><th class="px-2 py-1">Slice</th><th class="px-2 py-1">Age</th><th class="px-2 py-1">Benchmark (%)</th></tr>`;
            const tbody = document.createElement('tbody');
            for (const key in hardcodedBenchmarks) {
                const [market, slice, age] = key.split('|');
                const value = hardcodedBenchmarks[key];
                const row = document.createElement('tr');
                row.className = 'border-b border-slate-700';
                row.innerHTML = `<td class="px-2 py-1">${market}</td><td class="px-2 py-1">${slice}</td><td class="px-2 py-1">${age}</td><td class="px-2 py-1 font-medium">${value === null ? 'N/A' : value.toFixed(2)}</td>`;
                tbody.appendChild(row);
            }
            table.appendChild(thead);
            table.appendChild(tbody);
            benchmarkTableContainer.innerHTML = '';
            benchmarkTableContainer.appendChild(table);
        }

        async function handleBenchmarkFileUpload(event) {
            const file = event.target.files[0];
            if (!file || file.type !== 'text/csv') {
                showInfoModal("Please select a valid CSV file for the benchmarks.", "Invalid File");
                return;
            }
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const newBenchmarkObject = {};
                        results.data.forEach(row => {
                            const { Market, Slice, Age, LowerBoundBenchmark } = row;
                            if (Market && Slice && Age && LowerBoundBenchmark) {
                                const key = `${Market.trim()}|${Slice.trim()}|${Age.trim()}`;
                                const value = LowerBoundBenchmark.trim();
                                if (value.toUpperCase() === 'NA') {
                                    newBenchmarkObject[key] = null;
                                } else {
                                    const parsedValue = parseFloat(value.replace('%', ''));
                                    if (!isNaN(parsedValue)) newBenchmarkObject[key] = parsedValue;
                                }
                            }
                        });
                        
                        hardcodedBenchmarks = newBenchmarkObject;
                        await saveBenchmarksToFirestore(hardcodedBenchmarks);
                        renderBenchmarkTable();

                    } catch (e) {
                        showInfoModal("An error occurred while processing the benchmark file. Please check the console for details.", "Error");
                        console.error("Benchmark processing error:", e);
                    }
                },
                error: (error) => {
                    showInfoModal(`CSV Parsing Error: ${error.message}`, "Parsing Error");
                }
            });
            event.target.value = '';
        }


        // --- Utility/Calculation Functions ---
        function hasActionableRecommendation(campaign) {
            if (campaign.overrideAction && campaign.overrideAction.action !== 'MAINTAIN') return true;
            for (const seg in campaign.segments) {
                if (campaign.segments[seg].actions.some(a => a.action !== 'MAINTAIN' && a.action !== 'NO_ACTION_NEEDED')) {
                    return true;
                }
            }
            return false;
        }
       function parseDate(dateString) {
            if (!dateString || typeof dateString !== 'string') return null;
            
            const cleanedString = dateString.trim().replace(/\./g, '/');
            const currentYear = new Date().getFullYear();

            // Try to parse M/D/YY or M/D/YYYY
            let parts = cleanedString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
            if (parts) {
                let year = parseInt(parts[3], 10);
                if (year < 100) { // Handles YY format
                    year += 2000;
                }
                const date = new Date(Date.UTC(year, parts[1] - 1, parts[2]));
                if (!isNaN(date.getTime())) return date;
            }
            
            // Try to parse M/D (assuming current year)
            parts = cleanedString.match(/^(\d{1,2})\/(\d{1,2})$/);
            if (parts) {
                const date = new Date(Date.UTC(currentYear, parts[1] - 1, parts[2]));
                if (!isNaN(date.getTime())) return date;
            }

            // Try to parse YYYY-MM-DD
            parts = cleanedString.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
            if (parts) {
                const date = new Date(Date.UTC(parts[1], parts[2] - 1, parts[3]));
                if (!isNaN(date.getTime())) return date;
            }

            // Fallback to native parsing as a last resort
            const fallbackDate = new Date(dateString);
            return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
        }

        function formatDateForDisplay(dateString) {
            if (!dateString || dateString === 'N/A') return 'N/A';
            const date = parseDate(dateString);
            if (!date || isNaN(date.getTime())) return dateString;
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            return `${monthNames[date.getUTCMonth()]} ${date.getUTCDate()}`;
        }

        function calculateStatSig(ciLower, ciUpper) {
            if (typeof ciLower !== 'number' || typeof ciUpper !== 'number' || isNaN(ciLower) || isNaN(ciUpper)) return 'Neutral';
            if (ciLower > 0) return 'Positive';
            if (ciUpper < 0) return 'Negative';
            return 'Neutral';
        }

        function interpretStatSigValue(value) {
            const strValue = String(value).toLowerCase();
            if (strValue.includes('positive') || strValue === '1') return 'Positive';
            if (strValue.includes('negative') || strValue === '-1') return 'Negative';
            return 'Neutral';
        }

        function normalizeCountryName(name) {
            if (!name) return 'Unknown';
            const lowerName = String(name).toLowerCase().replace(/[\s.-]/g, '');
            if (lowerName.includes('southkorea') || lowerName.includes('korea') || lowerName === 'kr') return 'South Korea';
            if (lowerName.includes('india') || lowerName === 'in') return 'India';
            if (lowerName.includes('indonesia') || lowerName === 'id') return 'Indonesia';
            if (lowerName.includes('japan') || lowerName === 'jp') return 'Japan';
            return String(name);
        }

        const mapStatSigToSignal = (statSig) => {
            if (statSig === null || typeof statSig === 'undefined' || statSig === '') return "NEUTRAL";
            const lowerStatSig = String(statSig).toLowerCase();
            if (lowerStatSig.includes('positive')) return "SS_POSITIVE";
            if (lowerStatSig.includes('negative')) return "SS_NEGATIVE";
            return "NEUTRAL";
        };

        function transformGoogleSheetUrl(url) {
            const regex = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)\/.*gid=([0-9]+).*/;
            const match = url.match(regex);
            if (match && match[1] && match[2]) {
                return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${match[2]}`;
            }
            return null;
        }

        function checkForSliceAbnormalities(campaignsInCountry) {
            const abnormalSlices = {};
            const campaignsBySlice = campaignsInCountry.reduce((acc, c) => {
                if (!c.isEnded && !c.isTooNew) {
                    if (!acc[c.slice]) acc[c.slice] = [];
                    acc[c.slice].push(c);
                }
                return acc;
            }, {});

            for (const slice in campaignsBySlice) {
                const campaigns = campaignsBySlice[slice];
                let consistentlyPositiveCount = 0;
                let consistentlyNegativeCount = 0;

                campaigns.forEach(c => {
                    if (c.latest_week_data.sub_audience_18_24_signal === 'SS_POSITIVE' && c.latest_week_data.sub_audience_25_34_signal === 'SS_POSITIVE') {
                        consistentlyPositiveCount++;
                    }
                    if (c.latest_week_data.sub_audience_18_24_signal === 'SS_NEGATIVE' && c.latest_week_data.sub_audience_25_34_signal === 'SS_NEGATIVE') {
                        consistentlyNegativeCount++;
                    }
                });
                
                const totalCampaigns = campaigns.length;
                if (totalCampaigns > 1) {
                    if ((consistentlyPositiveCount / totalCampaigns) >= 0.8) abnormalSlices[slice] = 'Positive';
                    else if ((consistentlyNegativeCount / totalCampaigns) >= 0.8) abnormalSlices[slice] = 'Negative';
                }
            }
            return abnormalSlices;
        }

        function createCampaignObjectsFromLongFormat(allRows) {
            const keys = { campaign: 'campaign', market: 'country', age: 'age', value: 'shorts_dac_sct', type: 'value_type', slice: 'slice', statSig: 'stat_sig', start: 'campaign_start_date', end: 'campaign_end_date', rasta: 'rasta_end_date' };
            const validRows = allRows.filter(row => row[keys.value] != null && String(row[keys.value]).trim().toUpperCase() !== '#VALUE!');
            if (validRows.length === 0 && allRows.length > 0) throw new Error(`All rows filtered out. Check the '${keys.value}' column for valid data.`);
            validRows.forEach(row => { row[keys.value] = parseFloat(row[keys.value]); });

            const campaignsGrouped = validRows.reduce((acc, row) => {
                const name = String(row[keys.campaign] || 'Unknown').trim();
                const market = String(row[keys.market] || 'Unknown').trim();
                const slice = String(row[keys.slice] || 'N/A').trim();
                if (name === 'Unknown' || market === 'Unknown' || slice === 'N/A') return acc;
                const compositeKey = `${name}|${market}|${slice}`;
                if (!acc[compositeKey]) {
                    acc[compositeKey] = { name, market, slice, startDate: row[keys.start], campaignEndDate: row[keys.end], rastaEndDate: row[keys.rasta], rows: [] };
                }
                acc[compositeKey].rows.push(row);
                return acc;
            }, {});

            return Object.values(campaignsGrouped).map(campaignData => {
                const latest_week_data = {};
                
                const startDate = parseDate(campaignData.startDate);
                const rastaEndDate = parseDate(campaignData.rastaEndDate);
                let daysLive = 'N/A';
                if (startDate && rastaEndDate) {
                    const diffTime = Math.abs(rastaEndDate - startDate);
                    daysLive = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
                }

                ['18-24', '25-34', '18-34'].forEach(ageString => {
                    const normalizedAge = ageString.replace(/[\s–-]/g, '');
                    
                    const findRow = (typeSubstr) => campaignData.rows.find(r => {
                        const ageFromData = r[keys.age] ? String(r[keys.age]).replace(/[\s–-]/g, '') : '';
                        const typeFromData = r[keys.type] ? String(r[keys.type]).trim().toLowerCase().replace(/[\s()%-]/g, '') : '';
                        const cleanTypeSubstr = typeSubstr.replace(/[\s-]/g, ''); 
                        return ageFromData.includes(normalizedAge) && typeFromData.includes(cleanTypeSubstr);
                    });

                    const ratioRow = findRow('ratio');
                    if (ratioRow) {
                        const lowerRow = findRow('ci lower');
                        const upperRow = findRow('ci upper');
                        let statSigValue = 'Neutral';

                        if (ratioRow[keys.statSig] !== undefined && String(ratioRow[keys.statSig]).trim() !== "" && String(ratioRow[keys.statSig]).trim().toUpperCase() !== 'NA') {
                             statSigValue = interpretStatSigValue(ratioRow[keys.statSig]);
                        } else if (lowerRow && upperRow && lowerRow[keys.value] !== undefined && upperRow[keys.value] !== undefined) {
                             statSigValue = calculateStatSig(parseFloat(lowerRow[keys.value]), parseFloat(upperRow[keys.value]));
                        }

                        const prefix = (ageString === '18-34') ? 'audience_18_34' : `sub_audience_${ageString.replace('-', '_')}`;
                        latest_week_data[`${prefix}_value`] = ratioRow[keys.value];
                        latest_week_data[`${prefix}_stat_sig`] = statSigValue;
                        latest_week_data[`${prefix}_signal`] = mapStatSigToSignal(statSigValue);
                        latest_week_data[`${prefix}_value_l14d`] = ratioRow[keys.value];
                    }
                });

                if (Object.keys(latest_week_data).length === 0) return null;
                return {
                    ...campaignData,
                    market: normalizeCountryName(campaignData.market),
                    latest_week_data,
                    daysLive,
                    overrideAction: null,
                    segments: { "audience_18_34": { state: "active", actions: [] }, "18-24": { state: "active", actions: [] }, "25-34": { state: "active", actions: [] } },
                };
            }).filter(Boolean);
        }

        function runDecisionEngine(campaign, abnormalSlices = {}) {
            // --- Rule 0: Check for consistent slice abnormalities first (overrides all signals) ---
            const sliceAbnormality = abnormalSlices[campaign.slice];
            if (sliceAbnormality) {
                const reason = `Consistent ${sliceAbnormality} performance across >80% of campaigns.`;
                campaign.overrideAction = { action: "REVIEW: Abnormality", reason };
                return;
            }
            
            // --- Rule 0.5: Check for mandatory Pause/Relive instructions (highest priority override) ---
            const mandatoryRule18_34 = getAppliedRule(campaign.market, '18-34', campaign.slice, campaign.name);
            if (mandatoryRule18_34 && mandatoryRule18_34.action !== 'MAINTAIN') {
                const action = { action: mandatoryRule18_34.action, reason: `Mandatory ${mandatoryRule18_34.action} instruction set on ${formatDateForDisplay(mandatoryRule18_34.date.toISOString())}` };
                campaign.overrideAction = action;
                return;
            }
            // Check sub-segments for mandatory rules (if no overall rule applied)
            const mandatoryRule18_24 = getAppliedRule(campaign.market, '18-24', campaign.slice, campaign.name);
            const mandatoryRule25_34 = getAppliedRule(campaign.market, '25-34', campaign.slice, campaign.name);
            
            if ((mandatoryRule18_24 && mandatoryRule18_24.action !== 'MAINTAIN') || (mandatoryRule25_34 && mandatoryRule25_34.action !== 'MAINTAIN')) {
                 const action18_24 = mandatoryRule18_24 ? { action: mandatoryRule18_24.action, reason: `Mandatory ${mandatoryRule18_24.action} instruction set on ${formatDateForDisplay(mandatoryRule18_24.date.toISOString())}` } : null;
                 const action25_34 = mandatoryRule25_34 ? { action: mandatoryRule25_34.action, reason: `Mandatory ${mandatoryRule25_34.action} instruction set on ${formatDateForDisplay(mandatoryRule25_34.date.toISOString())}` } : null;

                // Prioritize Pause over Upbid in consolidation
                if ((action18_24?.action === 'PAUSE' || action25_34?.action === 'PAUSE')) {
                    campaign.overrideAction = { action: 'PAUSE', reason: 'Mandatory PAUSE instruction on one or both sub-segments.' };
                    return;
                }
                if (action18_24?.action === 'UPBID' && action25_34?.action === 'UPBID') {
                    campaign.overrideAction = { action: 'UPBID', reason: 'Mandatory UPBID instruction on both sub-segments.' };
                    return;
                }
                // If mixed (e.g., UPBID on 18-24, MAINTAIN on 25-34), let sub-segment evaluation below handle it, but prioritize the UPBID.
                if (action18_24?.action === 'UPBID') { campaign.overrideAction = { action: 'UPBID', segment: '18-24', reason: action18_24.reason }; return; }
                if (action25_34?.action === 'UPBID') { campaign.overrideAction = { action: 'UPBID', segment: '25-34', reason: action25_34.reason }; return; }
            }


            // --- Rule 1: Check campaign flight dates ---
            const rastaEndDate = parseDate(campaign.rastaEndDate);
            const campaignScheduledEndDate = parseDate(campaign.campaignEndDate);
            if (rastaEndDate && campaignScheduledEndDate && (rastaEndDate >= campaignScheduledEndDate)) {
                campaign.isEnded = true; return;
            }
            
            // --- Rule 2: Check if campaign is too new ---
            if (campaign.daysLive !== 'N/A' && campaign.daysLive <= 7) {
                campaign.isTooNew = true;
                return;
            }

            const getBenchmark = (market, slice, age) => hardcodedBenchmarks[`${market}|${slice}|${age}`] ?? -1000;
            const getSignal = (seg) => campaign.latest_week_data[(seg === '18-34' ? `audience_18_34_signal` : `sub_audience_${seg.replace('-', '_')}_signal`)] || 'NEUTRAL';
            const getValue = (seg) => campaign.latest_week_data[(seg === '18-34' ? `audience_18_34_value` : `sub_audience_${seg.replace('-', '_')}_value`)];

            // --- Rule 3: Parent segment (18-34) override ---
            if (getSignal('18-34') === 'SS_NEGATIVE') {
                const action = { action: "PAUSE", reason: "Statistically Significant Negative on 18-34" };
                campaign.segments['audience_18_34'].actions.push(action);
                campaign.segments['audience_18_34'].state = 'paused';
                return; 
            }

            // --- Rule 4: Evaluate sub-segments ---
            const tempActions = {};
            ['18-24', '25-34'].forEach(seg => {
                const signal = getSignal(seg);
                if (signal === 'SS_NEGATIVE') {
                    tempActions[seg] = { action: "PAUSE", reason: `Statistically Significant Negative on ${seg}` };
                } else if (signal === 'SS_POSITIVE') {
                    // UPBID justification based on comparison to control (implied Control Slice)
                    const controlValue = getValue('18-34'); // Assuming 18-34 control value is the benchmark for the segment
                    const controlReason = `Statistically Significant Positive vs Control (18-34)`;
                    
                    tempActions[seg] = { action: "UPBID", reason: controlReason };
                } else {
                    const value = getValue(seg);
                    const market = campaign.market.charAt(0).toUpperCase() + campaign.market.slice(1);
                    const benchmark = getBenchmark(market, campaign.slice, seg);
                    
                    let action = "MAINTAIN";
                    let reason = "Neutral performance.";

                    if (value !== undefined && value < 0 && value < benchmark) {
                        // Action: PAUSE, but reason flags it as BENCHMARK_BREACH, so it is skipped for display (as requested by user)
                        action = "PAUSE";
                        reason = `BENCHMARK_BREACH|${value}|${benchmark}`;
                    } else if (value !== undefined && value > 0 && value > benchmark) {
                        // If performance is positive but not statistically significant, maintain
                        action = "MAINTAIN";
                        reason = "Positive trend (Non-SS)";
                    }
                    
                    tempActions[seg] = { action, reason };
                }
            });

            const action18_24 = tempActions['18-24'];
            const action25_34 = tempActions['25-34'];

            // --- Rule 5: Consolidate actions if possible ---
            const canConsolidate =
                action18_24 && action25_34 &&
                action18_24.action === action25_34.action &&
                (String(action18_24.reason || '').split('|')[0] === String(action25_34.reason || '').split('|')[0]);

            if (canConsolidate && action18_24.action !== 'MAINTAIN') {
                
                // If consolidated action is PAUSE, check if it was due to BENCHMARK (which should be ignored unless it was SS Negative)
                if (action18_24.action === 'PAUSE' && String(action18_24.reason || '').startsWith('BENCHMARK_BREACH')) {
                     // Since both segments failed the benchmark, but not SS, we skip the action.
                     return;
                }
                
                let consolidatedReason = 'Consolidated action for 18-34 segment.';
                if (action18_24.action === 'PAUSE') {
                    consolidatedReason = 'Statistically Significant Negative in both 18-24 and 25-34 segments.';
                } else if (action18_24.action === 'UPBID') {
                    consolidatedReason = 'Statistically Significant Positive vs Control (18-34)'; // Consolidated UPBID reason
                }
                
                const action = { action: action18_24.action, reason: consolidatedReason };
                campaign.segments['audience_18_34'].actions.push(action);
                if (action.action === 'PAUSE') {
                    campaign.segments['audience_18_34'].state = 'paused';
                }
            } else {
                // Individual segment actions (excluding MAINTAIN and BENCHMARK PAUSE)
                if (action18_24 && action18_24.action !== 'MAINTAIN' && !String(action18_24.reason || '').startsWith('BENCHMARK_BREACH')) {
                    campaign.segments['18-24'].actions.push(action18_24);
                    if (action18_24.action === 'PAUSE') {
                        campaign.segments['18-24'].state = 'paused';
                    }
                }
                if (action25_34 && action25_34.action !== 'MAINTAIN' && !String(action25_34.reason || '').startsWith('BENCHMARK_BREACH')) {
                    campaign.segments['25-34'].actions.push(action25_34);
                    if (action25_34.action === 'PAUSE') {
                        campaign.segments['25-34'].state = 'paused';
                    }
                }
            }
        }