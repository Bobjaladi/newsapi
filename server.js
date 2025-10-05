const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection (optional - for storing news)
mongoose.connect('mongodb://localhost:27017/telugunews', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// News Schema
const newsSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    category: String,
    source: String,
    imageUrl: String,
    newsUrl: String,
    publishedAt: Date,
    language: { type: String, default: 'te' }
});

const News = mongoose.model('News', newsSchema);

// Sample Telugu News Data
const sampleTeluguNews = [
    {
        title: "ఆంధ్రప్రదేశ్లో కొత్త మంత్రిమండలి",
        description: "ముఖ్యమంత్రి నారా చంద్రబాబు నాయుడు నేతృత్వంలో కొత్త మంత్రిమండలి ప్రమాణ స్వీకారం నేడు రాష్ట్రపతి భవన్లో జరిగింది.",
        content: "ఆంధ్రప్రదేశ్లో కొత్త మంత్రిమండలి ప్రమాణ స్వీకారం నేడు రాష్ట్రపతి భవన్లో జరిగింది. ముఖ్యమంత్రి నారా చంద్రబాబు నాయుడు నేతృత్వంలో 25 మంది మంత్రులు ప్రమాణ స్వీకారం చేశారు. ఈ మంత్రిమండలిలో 5 మంది డిప్యూటీ సీఎం‌లు నియమితులయ్యారు. కొత్త మంత్రిమండలి రాష్ట్ర అభివృద్ధికి కట్టుబడి పని చేస్తుందని ముఖ్యమంత్రి తెలిపారు.",
        category: "రాజకీయాలు",
        source: "ఆంధ్రజ్యోతి",
        imageUrl: "https://example.com/images/cm.jpg",
        newsUrl: "https://andhrajyothy.com/article1",
        publishedAt: new Date("2024-06-12")
    },
    {
        title: "హైదరాబాద్లో భారీ వర్షాలు",
        description: "హైదరాబాద్ మరియు పరిసర ప్రాంతాల్లో భారీ వర్షాలు కొనసాగుతున్నాయి. నగరంలో అనేక ప్రాంతాలు జలమయమయ్యాయి.",
        content: "హైదరాబాద్ మరియు పరిసర ప్రాంతాల్లో భారీ వర్షాలు కొనసాగుతున్నాయి. గత 24 గంటలలో నగరంలో 12 సెంటీమీటర్ల వర్షపాతం నమోదైంది. అనేక తక్కువ ఎత్తు ప్రాంతాలు జలమయమయ్యాయి. వరదబాధితులకు ప్రభుత్వం త్వరిత రక్షణ పనులు ప్రారంభించింది. వాతావరణ శాఖ మరో 48 గంటల పాటు వర్షాలు కొనసాగవచ్చని హెచ్చరించింది.",
        category: "వాతావరణం",
        source: "సాక్షి",
        imageUrl: "https://example.com/images/rain.jpg",
        newsUrl: "https://sakshi.com/news/hyderabad-rains",
        publishedAt: new Date("2024-06-11")
    },
    {
        title: "తెలంగాణలో ఉచిత విద్యుత్ యోజన",
        description: "తెలంగాణ ప్రభుత్వం 200 యూనిట్ల వరకు ఉచిత విద్యుత్ ప్రకటించింది. ఈ యోజన ద్వారా 25 లక్షల కుటుంబాలు లబ్ధిపొందుతాయి.",
        content: "తెలంగాణ ప్రభుత్వం 200 యూనిట్ల వరకు ఉచిత విద్యుత్ ప్రకటించింది. ఈ యోజన ద్వారా రాష్ట్రంలోని 25 లక్షల కుటుంబాలు లబ్ధిపొందుతాయి. ముఖ్యమంత్రి రేవంత్ రెడ్డి ఈ నిర్ణయాన్ని మంగళవారం ప్రకటించారు. ఈ యోజనకు సంవత్సరానికి 500 కోట్ల రూపాయల భారం వస్తుంది. ప్రజల ఆర్థిక భారాన్ని తగ్గించడమే ఈ యోజన లక్ష్యంగా ప్రభుత్వం తెలిపింది.",
        category: "ప్రభుత్వం",
        source: "నమస్తే తెలంగాణ",
        imageUrl: "https://example.com/images/electricity.jpg",
        newsUrl: "https://telanganatoday.com/free-electricity",
        publishedAt: new Date("2024-06-10")
    },
    {
        title: "విజయవాడలో మెట్రో రైలు ప్రాజెక్ట్",
        description: "విజయవాడ మెట్రో రైలు ప్రాజెక్ట్ కు కేంద్రం నుంచి ఆమోదం. 5,000 కోట్ల రూపాయలతో ఈ ప్రాజెక్ట్ నెలకొల్పబడుతుంది.",
        content: "విజయవాడ మెట్రో రైలు ప్రాజెక్ట్ కు కేంద్రం నుంచి ఆమోదం వచ్చింది. 5,000 కోట్ల రూపాయలతో ఈ ప్రాజెక్ట్ నెలకొల్పబడుతుంది. మొదటి దశలో 50 కిలోమీటర్ల మార్గం నిర్మించబడుతుంది. ఈ ప్రాజెక్ట్ ద్వారా విజయవాడ నగరం యావత్తు ప్రాంతంలో సులభంగా ప్రయాణించడానికి అవకాశం ఏర్పడుతుంది. రెండు సంవత్సరాలలో ప్రాజెక్ట్ పూర్తి చేయాలని లక్ష్యంగా పెట్టుకున్నారు.",
        category: "అభివృద్ధి",
        source: "ఈనాడు",
        imageUrl: "https://example.com/images/metro.jpg",
        newsUrl: "https://eenadu.net/vijayawada-metro",
        publishedAt: new Date("2024-06-09")
    },
    {
        title: "తెలుగు సినిమా పురస్కారాలు",
        description: "జాతీయ తెలుగు సినిమా పురస్కారాలు ప్రకటించబడ్డాయి. ఉత్తమ చిత్రంగా 'పుష్పా: ది రైజ్' ఎంపికైంది.",
        content: "జాతీయ తెలుగు సినిమా పురస్కారాలు ప్రకటించబడ్డాయి. ఉత్తమ చిత్రంగా 'పుష్పా: ది రైజ్' ఎంపికైంది. అల్లు అర్జున్ ఉత్తమ నటుడిగా, రశ్మికా మందన్న ఉత్తమ నటిగా పురస్కారాలు అందుకున్నారు. సుకుమార్ ఉత్తమ దర్శకుడిగా ఎంపికైనారు. ఈ సంవత్సరం 25 విభాగాల్లో పురస్కారాలు ప్రకటించబడ్డాయి. ప్రతి విజేతకు 1 లక్ష రూపాయల నగదు బహుమతితో పురస్కారం ఇవ్వబడుతుంది.",
        category: "వినోదం",
        source: "ఆంధ్రప్రభ",
        imageUrl: "https://example.com/images/awards.jpg",
        newsUrl: "https://andhraprabha.com/cinema-awards",
        publishedAt: new Date("2024-06-08")
    }
];

// Add 25 more sample news items...
for (let i = 6; i <= 30; i++) {
    sampleTeluguNews.push({
        title: `తెలుగు వార్తా శీర్షిక ${i}`,
        description: `ఇది నమూనా తెలుగు వార్తా వివరణ ${i}. ఇక్కడ వార్త యొక్క సంక్షిప్త వివరణ ఉంటుంది.`,
        content: `ఇది పూర్తి తెలుగు వార్తా విషయము ${i}. ఇక్కడ వివరణాత్మకమైన వార్తా విషయం ఉంటుంది. ఇది పూర్తి వివరాలతో కూడిన వార్తా లేఖనం.`,
        category: ["రాజకీయాలు", "వాతావరణం", "ప్రభుత్వం", "అభివృద్ధి", "వినోదం", "క్రీడలు", "వ్యాపారం"][Math.floor(Math.random() * 7)],
        source: ["ఆంధ్రజ్యోతి", "సాక్షి", "నమస్తే తెలంగాణ", "ఈనాడు", "ఆంధ్రప్రభ", "వార్త", "ఆంధ్రప్రభ"][Math.floor(Math.random() * 7)],
        imageUrl: `https://example.com/images/news${i}.jpg`,
        newsUrl: `https://telugunews.com/article${i}`,
        publishedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    });
}

// API Routes

// Get all news
app.get('/api/news', async (req, res) => {
    try {
        const { category, page = 1, limit = 30 } = req.query;
        
        let news = sampleTeluguNews;
        
        // Filter by category if provided
        if (category && category !== 'all') {
            news = news.filter(item => item.category === category);
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedNews = news.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: paginatedNews,
            total: news.length,
            page: parseInt(page),
            totalPages: Math.ceil(news.length / limit)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'వార్తలు లోడ్ చేయడంలో లోపం'
        });
    }
});

// Get news by category
app.get('/api/news/category/:category', (req, res) => {
    const { category } = req.params;
    const filteredNews = sampleTeluguNews.filter(item => 
        item.category.toLowerCase() === category.toLowerCase()
    );
    
    res.json({
        success: true,
        data: filteredNews,
        total: filteredNews.length
    });
});

// Search news
app.get('/api/news/search', (req, res) => {
    const { q } = req.query;
    
    if (!q) {
        return res.status(400).json({
            success: false,
            message: 'శోధన పదం అవసరం'
        });
    }
    
    const searchResults = sampleTeluguNews.filter(item =>
        item.title.toLowerCase().includes(q.toLowerCase()) ||
        item.description.toLowerCase().includes(q.toLowerCase()) ||
        item.content.toLowerCase().includes(q.toLowerCase())
    );
    
    res.json({
        success: true,
        data: searchResults,
        total: searchResults.length
    });
});

// Get categories
app.get('/api/categories', (req, res) => {
    const categories = [...new Set(sampleTeluguNews.map(item => item.category))];
    res.json({
        success: true,
        data: categories
    });
});

// Get single news item
app.get('/api/news/:id', (req, res) => {
    const { id } = req.params;
    const newsId = parseInt(id);
    
    if (newsId >= 1 && newsId <= sampleTeluguNews.length) {
        res.json({
            success: true,
            data: sampleTeluguNews[newsId - 1]
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'వార్త కనుగొనబడలేదు'
        });
    }
});

// Web scraper for real Telugu news (optional)
app.get('/api/scrape/telugu-news', async (req, res) => {
    try {
        // This is a sample web scraper - you can add actual Telugu news websites
        const scrapedNews = [];
        
        // Example: Scrape from a Telugu news website (replace with actual URLs)
        try {
            const response = await axios.get('https://www.eenadu.net', {
                timeout: 5000
            });
            const $ = cheerio.load(response.data);
            
            // Sample scraping logic - adjust based on actual website structure
            $('.news-headline').each((i, elem) => {
                if (i < 10) {
                    scrapedNews.push({
                        title: $(elem).text().trim(),
                        description: $(elem).next('.news-desc').text().trim(),
                        source: 'ఈనాడు',
                        category: 'సాధారణ',
                        newsUrl: $(elem).find('a').attr('href')
                    });
                }
            });
        } catch (scrapeError) {
            console.log('Scraping failed, using sample data');
        }
        
        // If scraping fails, return sample data
        const newsToReturn = scrapedNews.length > 0 ? scrapedNews : sampleTeluguNews.slice(0, 10);
        
        res.json({
            success: true,
            data: newsToReturn,
            source: scrapedNews.length > 0 ? 'scraped' : 'sample'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'వార్తలు స్క్రాప్ చేయడంలో లోపం'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'తెలుగు వార్తల API సక్రమంగా పని చేస్తోంది',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`తెలుగు వార్తల API సర్వర్ పోర్ట్ ${PORT}లో అమలవుతోంది`);
    console.log(`API URL: http://localhost:${PORT}/api/news`);
});

module.exports = app;