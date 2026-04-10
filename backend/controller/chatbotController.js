import Property from '../models/propertymodel.js';

export const handleChat = async (req, res) => {
    try {
        const { message, context } = req.body;
        if (!message) {
            return res.status(400).json({ reply: "Please send a message." });
        }

        const msgLower = message.toLowerCase();
        let reply = "I am your real estate assistant. How can I help you today?";

        // Simple Greeting
        if (msgLower === 'hi' || msgLower === 'hello' || msgLower === 'hey') {
            return res.json({ reply: "Hello! Welcome to our real estate platform. Are you looking to buy, rent, or sell a property?" });
        }

        // Initialize query for active properties
        const query = { status: { $in: ['active', undefined] } }; // fallback for older properties without status
        let isSearch = false;

        // Detect BHK
        const bhkMatch = msgLower.match(/(\d+)\s*bhk/);
        if (bhkMatch) {
            query.beds = Number(bhkMatch[1]);
            isSearch = true;
        }

        // Detect Property Type
        if (msgLower.includes('flat') || msgLower.includes('apartment')) {
            query.type = { $regex: /flat|apartment/i };
            isSearch = true;
        } else if (msgLower.includes('villa')) {
            query.type = { $regex: /villa/i };
            isSearch = true;
        } else if (msgLower.includes('house')) {
            query.type = { $regex: /house/i };
            isSearch = true;
        }

        // Detect Price/Budget (very naive)
        const priceMatch = msgLower.match(/(under|below)\s*(\d+)\s*(lakh|lakhs|cr|crore)/);
        if (priceMatch) {
            const num = Number(priceMatch[2]);
            const unit = priceMatch[3];
            let maxPrice = num;
            if (unit.startsWith('cr')) maxPrice = num * 10000000;
            else if (unit.startsWith('lakh')) maxPrice = num * 100000;
            
            query.price = { $lte: maxPrice };
            isSearch = true;
        }

        // Detect potential location names (words starting with capitals or known cities if we do basic heuristic)
        // Since we are matching user input, we'll try to extract any word > 3 letters that isn't a stopword.
        const stopWords = ['looking', 'want', 'need', 'property', 'real', 'estate', 'find', 'show', 'under', 'below', 'price', 'budget', 'that', 'with', 'some'];
        const words = msgLower.split(/[\s,]+/).filter(w => w.length > 3 && !stopWords.includes(w) && !w.includes('bhk') && !w.includes('lakh') && !w.includes('crore'));
        
        let locationFilters = [];
        if (words.length > 0) {
            words.forEach(word => {
                locationFilters.push({ location: { $regex: word, $options: 'i' } });
            });
            if (locationFilters.length > 0) {
                if (query.$or) {
                    // merge with existing $or if any, but since we don't have, just assign
                } else {
                    query.$or = locationFilters;
                }
                isSearch = true;
            }
        }

        let responseProperties = [];
        if (isSearch || msgLower.includes('buy') || msgLower.includes('rent')) {
            // Find properties matching the criteria
            const properties = await Property.find(query).limit(3);

            if (properties.length > 0) {
                reply = `I found ${properties.length} properties that might match your criteria. Here are the top matches:`;
                responseProperties = properties.map(p => ({
                    _id: p._id,
                    title: p.title,
                    location: p.location,
                    price: p.price,
                    beds: p.beds,
                    image: (p.image && p.image.length > 0) ? p.image[0] : ''
                }));
            } else {
                reply = "I couldn't find any properties matching your exact criteria right now. Could you try adjusting your budget or location?";
            }
        } else {
            reply = "I'm your virtual real estate assistant. I can help you search for properties from our database. Try saying something like 'Show me 2 BHK flats in Mumbai' or 'Villas under 50 lakhs'.";
        }

        // Return a delay to simulate typing
        setTimeout(() => {
            res.json({ reply, properties: responseProperties });
        }, 800);

    } catch (error) {
        console.error("Chatbot Error:", error);
        res.status(500).json({ reply: "Sorry, I'm having trouble connecting to my database right now. Please try again later." });
    }
};
