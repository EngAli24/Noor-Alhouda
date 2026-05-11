require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/User');

const app = express();

// ==========================================
// 1. الإعدادات الأساسية
// ==========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. تشغيل ملفات الموقع (HTML, CSS, JS)
// ==========================================
app.use(express.static(path.join(__dirname, '../')));

// ==========================================
// الاتصال بقاعدة البيانات
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح'))
    .catch(err => console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err));

// ==========================================
// مسارات الحسابات (Auth)
// ==========================================
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (password.length < 8) return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل!' });

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'اسم المستخدم مسجل بالفعل!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword, appData: {} });
        await newUser.save();
        res.status(201).json({ message: 'تم إنشاء الحساب بنجاح!' });
    } catch (error) { res.status(500).json({ message: 'حدث خطأ في الخادم' }); }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'بيانات الدخول غير صحيحة!' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.json({ message: 'تم تسجيل الدخول', token, username: user.username, bio: user.bio });
    } catch (error) { res.status(500).json({ message: 'حدث خطأ في الخادم' }); }
});

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: 'غير مصرح لك بالوصول!' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next(); 
    } catch (error) { res.status(400).json({ message: 'جلسة غير صالحة!' }); }
};

// ==========================================
// مسارات البروفايل والمزامنة (Sync)
// ==========================================
app.get('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'خطأ أثناء جلب البيانات' }); }
});

// ✅ التحديث: إضافة التحقق من الباسورد القديم (oldPassword)
app.put('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { username, bio, oldPassword, newPassword } = req.body;
        let updateData = { bio };

        // 1. تحديث اسم المستخدم
        if (username) {
            const existing = await User.findOne({ username, _id: { $ne: req.user.userId } });
            if (existing) return res.status(400).json({ message: 'اسم المستخدم مستخدم بالفعل!' });
            updateData.username = username;
        }

        // 2. تحديث كلمة المرور (لازم يدخل القديمة الأول)
        if (newPassword || oldPassword) {
            if (!oldPassword) return res.status(400).json({ message: 'يجب إدخال كلمة المرور الحالية للتأكيد!' });
            if (!newPassword) return res.status(400).json({ message: 'يرجى إدخال كلمة المرور الجديدة!' });

            const user = await User.findById(req.user.userId);
            
            // التأكد من أن القديمة صحيحة
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة!' });

            // التأكد من طول الجديدة
            if (newPassword.length < 8) return res.status(400).json({ message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل!' });
            
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(newPassword, salt);
        }

        // 3. تنفيذ التحديث
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId, 
            { $set: updateData }, 
            { returnDocument: 'after' }
        ).select('-password');
        
        res.json({ message: 'تم التحديث بنجاح', user: updatedUser });
    } catch (error) { res.status(500).json({ message: 'خطأ أثناء التحديث' }); }
});

app.post('/api/user/sync', verifyToken, async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(req.user.userId, { appData: req.body }, { returnDocument: 'after' });
        res.json({ message: 'تمت المزامنة بنجاح', appData: updatedUser.appData });
    } catch (error) { res.status(500).json({ message: 'خطأ في المزامنة' }); }
});

app.get('/api/user/sync', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        res.json({ appData: user.appData || {} });
    } catch (error) { res.status(500).json({ message: 'خطأ في جلب البيانات' }); }
});

// ==========================================
// مسارات الأذكار والأحاديث من الداتا بيز
// ==========================================
const Zekr = mongoose.model('Zekr', new mongoose.Schema({
    id: String, category: String, title: String, text: String, count: Number, fadila: String
}));

const Hadith = mongoose.model('Hadith', new mongoose.Schema({
    id: String, category: String, text: String, explanation: String, source: String
}));

app.get('/api/data/azkar', async (req, res) => {
    try {
        const azkar = await Zekr.find();
        res.json(azkar);
    } catch (e) { res.status(500).json({ message: 'خطأ في جلب الأذكار' }); }
});

app.get('/api/data/hadiths', async (req, res) => {
    try {
        const hadiths = await Hadith.find();
        res.json(hadiths);
    } catch (e) { res.status(500).json({ message: 'خطأ في جلب الأحاديث' }); }
});

// ==========================================
// بدء التشغيل
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`اضغط هنا لفتح الموقع: http://localhost:${PORT}`);   
    console.log(`========================================\n`);
});