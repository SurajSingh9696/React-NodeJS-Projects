const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(cors(
    {
        origin: 'http://127.0.0.1:3000/02-EcoTrack/Frontend/index.html',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
));
app.use(express.static('.')); // Serve static files

// MongoDB Atlas Connection with Async/Await
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ecotrack?retryWrites=true&w=majority');

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

// Connect to MongoDB Atlas
connectDB();

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    ecoStats: {
        totalPoints: { type: Number, default: 0 },
        co2Saved: { type: Number, default: 0 },
        waterSaved: { type: Number, default: 0 },
        wasteReduced: { type: Number, default: 0 },
        energySaved: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Activity Schema
const activitySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    activityType: { type: String, required: true },
    points: { type: Number, required: true },
    co2Saved: { type: Number, default: 0 },
    waterSaved: { type: Number, default: 0 },
    wasteReduced: { type: Number, default: 0 },
    energySaved: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Activity = mongoose.model('Activity', activitySchema);

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Auth Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) throw new Error();
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) throw new Error();
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Routes

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                ecoStats: user.ecoStats
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                ecoStats: user.ecoStats
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user stats
app.get('/api/stats', auth, async (req, res) => {
    try {
        res.json(req.user.ecoStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Log activity
app.post('/api/activities', auth, async (req, res) => {
    try {
        const { activityType } = req.body;
        
        const activities = {
            'reusable-bottle': { points: 5, co2: 0.1, water: 1, waste: 0.05, energy: 0 },
            'walked': { points: 10, co2: 0.5, water: 0, waste: 0, energy: 0 },
            'recycled': { points: 7, co2: 0.3, water: 0.5, waste: 0.1, energy: 0.1 },
            'led-bulb': { points: 8, co2: 0.2, water: 0, waste: 0, energy: 0.5 }
        };
        
        const activity = activities[activityType];
        if (!activity) {
            return res.status(400).json({ error: 'Invalid activity type' });
        }
        
        // Create activity record
        const newActivity = new Activity({
            userId: req.user._id,
            activityType,
            points: activity.points,
            co2Saved: activity.co2,
            waterSaved: activity.water,
            wasteReduced: activity.waste,
            energySaved: activity.energy
        });
        await newActivity.save();
        
        // Update user stats
        req.user.ecoStats.totalPoints += activity.points;
        req.user.ecoStats.co2Saved += activity.co2;
        req.user.ecoStats.waterSaved += activity.water;
        req.user.ecoStats.wasteReduced += activity.waste;
        req.user.ecoStats.energySaved += activity.energy;
        
        await req.user.save();
        
        res.json({
            activity: newActivity,
            stats: req.user.ecoStats
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get activities
app.get('/api/activities', auth, async (req, res) => {
    try {
        const activities = await Activity.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// const express = require('express');
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const cors = require('cors');
// require('dotenv').config();

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use(express.static('.'));

// // Enhanced MongoDB Atlas Connection with better error handling
// const connectDB = async () => {
//   try {
//     // Debug: Check if environment variables are loaded
//     console.log('Environment variables loaded:', {
//       hasMongoURI: !!process.env.MONGODB_URI,
//       hasMongoComponents: !!(process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && process.env.MONGODB_CLUSTER && process.env.MONGODB_DATABASE)
//     });

//     let connectionString;
    
//     // Option 1: Use full connection string from environment
//     if (process.env.MONGODB_URI) {
//       connectionString = process.env.MONGODB_URI;
//       console.log('Using MONGODB_URI from environment');
//     } 
//     // Option 2: Build connection string from components
//     else if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD && 
//              process.env.MONGODB_CLUSTER && process.env.MONGODB_DATABASE) {
//       const username = encodeURIComponent(process.env.MONGODB_USERNAME);
//       const password = encodeURIComponent(process.env.MONGODB_PASSWORD);
//       const cluster = process.env.MONGODB_CLUSTER;
//       const database = process.env.MONGODB_DATABASE;
      
//       connectionString = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
//       console.log('Using connection string built from components');
//     }
//     // Option 3: Fallback for development
//     else {
//       connectionString = 'mongodb://localhost:27017/ecotrack';
//       console.log('Using fallback local connection');
//     }

//     // Debug: Log the connection string (without password for security)
//     const safeLogString = connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
//     console.log('Connection string:', safeLogString);

//     // Remove any port number if present (common issue)
//     connectionString = connectionString.replace(/:(\d+)\//, '/');
    
//     const conn = await mongoose.connect(connectionString, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//       useCreateIndex: true,
//       useFindAndModify: false,
//       serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
//       socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
//     });

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//     return true;
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error.message);
    
//     // Provide more specific error messages
//     if (error.name === 'MongoNetworkError') {
//       console.error('Network error. Check your internet connection and MongoDB Atlas IP whitelist.');
//     } else if (error.name === 'MongooseServerSelectionError') {
//       console.error('Server selection error. Check your connection string and cluster status.');
//     } else if (error.message.includes('auth failed')) {
//       console.error('Authentication failed. Check your username and password.');
//     } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
//       console.error('DNS lookup failed. Check your cluster URL.');
//     }
    
//     return false;
//   }
// };

// // Connection retry logic
// const connectWithRetry = async (maxRetries = 5, delay = 5000) => {
//   let retries = 0;
  
//   while (retries < maxRetries) {
//     console.log(`Attempting MongoDB connection (${retries + 1}/${maxRetries})...`);
    
//     const connected = await connectDB();
//     if (connected) {
//       return true;
//     }
    
//     retries++;
//     if (retries < maxRetries) {
//       console.log(`Retrying in ${delay/1000} seconds...`);
//       await new Promise(resolve => setTimeout(resolve, delay));
//     }
//   }
  
//   console.error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
//   process.exit(1);
// };

// // Connect to MongoDB with retry logic
// connectWithRetry();

// // User Schema
// const userSchema = new mongoose.Schema({
//     username: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     ecoStats: {
//         totalPoints: { type: Number, default: 0 },
//         co2Saved: { type: Number, default: 0 },
//         waterSaved: { type: Number, default: 0 },
//         wasteReduced: { type: Number, default: 0 },
//         energySaved: { type: Number, default: 0 }
//     }
// }, { timestamps: true });

// // Activity Schema
// const activitySchema = new mongoose.Schema({
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     activityType: { type: String, required: true },
//     points: { type: Number, required: true },
//     co2Saved: { type: Number, default: 0 },
//     waterSaved: { type: Number, default: 0 },
//     wasteReduced: { type: Number, default: 0 },
//     energySaved: { type: Number, default: 0 }
// }, { timestamps: true });

// const User = mongoose.model('User', userSchema);
// const Activity = mongoose.model('Activity', activitySchema);

// // JWT Secret
// const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// // Auth Middleware
// const auth = async (req, res, next) => {
//     try {
//         const token = req.header('Authorization')?.replace('Bearer ', '');
//         if (!token) throw new Error();
        
//         const decoded = jwt.verify(token, JWT_SECRET);
//         const user = await User.findById(decoded.userId);
//         if (!user) throw new Error();
        
//         req.user = user;
//         next();
//     } catch (error) {
//         res.status(401).json({ error: 'Please authenticate' });
//     }
// };

// // Routes remain the same as in your original code
// // Register, Login, Stats, Activities routes...

// // Routes

// // Register
// app.post('/api/register', async (req, res) => {
//     try {
//         const { username, email, password } = req.body;
        
//         // Check if user exists
//         const existingUser = await User.findOne({ $or: [{ email }, { username }] });
//         if (existingUser) {
//             return res.status(400).json({ error: 'User already exists' });
//         }

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);
        
//         // Create user
//         const user = new User({
//             username,
//             email,
//             password: hashedPassword
//         });
        
//         await user.save();
        
//         // Generate token
//         const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
//         res.status(201).json({
//             message: 'User created successfully',
//             token,
//             user: {
//                 id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 ecoStats: user.ecoStats
//             }
//         });
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// // Login
// app.post('/api/login', async (req, res) => {
//     try {
//         const { email, password } = req.body;
        
//         // Find user
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }
        
//         // Check password
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(400).json({ error: 'Invalid credentials' });
//         }
        
//         // Generate token
//         const token = jwt.sign({ userId: user._id }, JWT_SECRET);
        
//         res.json({
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user._id,
//                 username: user.username,
//                 email: user.email,
//                 ecoStats: user.ecoStats
//             }
//         });
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// // Get user stats
// app.get('/api/stats', auth, async (req, res) => {
//     try {
//         res.json(req.user.ecoStats);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Log activity
// app.post('/api/activities', auth, async (req, res) => {
//     try {
//         const { activityType } = req.body;
        
//         const activities = {
//             'reusable-bottle': { points: 5, co2: 0.1, water: 1, waste: 0.05, energy: 0 },
//             'walked': { points: 10, co2: 0.5, water: 0, waste: 0, energy: 0 },
//             'recycled': { points: 7, co2: 0.3, water: 0.5, waste: 0.1, energy: 0.1 },
//             'led-bulb': { points: 8, co2: 0.2, water: 0, waste: 0, energy: 0.5 }
//         };
        
//         const activity = activities[activityType];
//         if (!activity) {
//             return res.status(400).json({ error: 'Invalid activity type' });
//         }
        
//         // Create activity record
//         const newActivity = new Activity({
//             userId: req.user._id,
//             activityType,
//             points: activity.points,
//             co2Saved: activity.co2,
//             waterSaved: activity.water,
//             wasteReduced: activity.waste,
//             energySaved: activity.energy
//         });
//         await newActivity.save();
        
//         // Update user stats
//         req.user.ecoStats.totalPoints += activity.points;
//         req.user.ecoStats.co2Saved += activity.co2;
//         req.user.ecoStats.waterSaved += activity.water;
//         req.user.ecoStats.wasteReduced += activity.waste;
//         req.user.ecoStats.energySaved += activity.energy;
        
//         await req.user.save();
        
//         res.json({
//             activity: newActivity,
//             stats: req.user.ecoStats
//         });
//     } catch (error) {
//         res.status(400).json({ error: error.message });
//     }
// });

// // Get activities
// app.get('/api/activities', auth, async (req, res) => {
//     try {
//         const activities = await Activity.find({ userId: req.user._id })
//             .sort({ createdAt: -1 })
//             .limit(20);
//         res.json(activities);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });


// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });