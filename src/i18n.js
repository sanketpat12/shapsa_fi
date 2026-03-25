import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Resources for local Indian languages + English
const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "products": "Products",
        "myProducts": "My Products",
        "myOrders": "My Orders",
        "orders": "Orders",
        "deals": "Deals",
        "dashboard": "Dashboard",
        "inventory": "Inventory",
        "customers": "Customers",
        "retailers": "Retailers",
        "settings": "Settings",
        "logout": "Logout",
        "notifications": "Notifications"
      },
      "common": {
        "search": "Search",
        "language": "Language",
        "totalProducts": "Total Products",
        "healthyStock": "Healthy Stock",
        "lowStock": "Low Stock",
        "critical": "Critical",
        "deadStock": "Dead Stock",
        "addToCart": "Add to Cart",
        "buyNow": "Buy Now",
        "price": "Price",
        "stock": "Stock",
        "status": "Status",
        "actions": "Actions",
        "update": "Update",
        "cancel": "Cancel",
        "save": "Save"
      },
      "dashboard": {
        "welcome": "Welcome back",
        "salesToday": "Sales Today",
        "revenue": "Revenue",
        "recentOrders": "Recent Orders",
        "topProducts": "Top Products"
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "home": "होम",
        "products": "उत्पाद",
        "myProducts": "मेरे उत्पाद",
        "myOrders": "मेरे आदेश",
        "orders": "आदेश",
        "deals": "सौदे",
        "dashboard": "डैशबोर्ड",
        "inventory": "माल-सूची",
        "customers": "ग्राहक",
        "retailers": "खुदरा विक्रेता",
        "settings": "सेटिंग्स",
        "logout": "लॉग आउट",
        "notifications": "सूचनाएं"
      },
      "common": {
        "search": "खोजें",
        "language": "भाषा",
        "totalProducts": "कुल उत्पाद",
        "healthyStock": "स्वस्थ स्टॉक",
        "lowStock": "कम स्टॉक",
        "critical": "गंभीर",
        "deadStock": "मृत स्टॉक",
        "addToCart": "कार्ट में डालें",
        "buyNow": "अभी खरीदें",
        "price": "मूल्य",
        "stock": "स्टॉक",
        "status": "स्थिति",
        "actions": "कार्रवाइयां",
        "update": "अद्यतन",
        "cancel": "रद्द करें",
        "save": "सहेजें"
      },
      "dashboard": {
        "welcome": "वापसी पर स्वागत है",
        "salesToday": "आज की बिक्री",
        "revenue": "राजस्व",
        "recentOrders": "हाल के आदेश",
        "topProducts": "शीर्ष उत्पाद"
      }
    }
  },
  mr: {
    translation: {
      "nav": {
        "home": "मुख्यपृष्ठ",
        "products": "उत्पादने",
        "myProducts": "माझी उत्पादने",
        "myOrders": "माझ्या ऑर्डर्स",
        "orders": "ऑर्डर्स",
        "deals": "सवलती",
        "dashboard": "डॅशबोर्ड",
        "inventory": "इन्वेंटरी",
        "customers": "ग्राहक",
        "retailers": "विक्रेते",
        "settings": "सेटिंग्ज",
        "logout": "लॉग आउट",
        "notifications": "सूचना"
      },
      "common": {
        "search": "शोधा",
        "language": "भाषा",
        "totalProducts": "एकूण उत्पादने",
        "healthyStock": "निरोगी स्टॉक",
        "lowStock": "कमी स्टॉक",
        "critical": "गंभीर",
        "deadStock": "डेड स्टॉक",
        "addToCart": "कार्टमध्ये जोडा",
        "buyNow": "आता खरेदी करा",
        "price": "किंमत",
        "stock": "स्टॉक",
        "status": "स्थिती",
        "actions": "कृती",
        "update": "अपडेट",
        "cancel": "रद्द करा",
        "save": "जतन करा"
      },
      "dashboard": {
        "welcome": "आपले पुन्हा स्वागत आहे",
        "salesToday": "आजची विक्री",
        "revenue": "महसूल",
        "recentOrders": "अलीकडील ऑर्डर्स",
        "topProducts": "शीर्ष उत्पादने"
      }
    }
  },
  gu: {
    translation: {
      "nav": {
        "home": "મુખ્ય પૃષ્ઠ",
        "products": "ઉત્પાદનો",
        "myProducts": "મારા ઉત્પાદનો",
        "myOrders": "મારા ઓર્ડર્સ",
        "orders": "ઓર્ડર્સ",
        "deals": "ડીલ્સ",
        "dashboard": "ડેશબોર્ડ",
        "inventory": "યાદી",
        "customers": "ગ્રાહકો",
        "retailers": "રિટેલર્સ",
        "settings": "સેટિંગ્સ",
        "logout": "લોગ આઉટ",
        "notifications": "સૂચનાઓ"
      },
      "common": {
        "search": "શોધો",
        "language": "ભાષા",
        "totalProducts": "કુલ ઉત્પાદનો",
        "healthyStock": "સ્વસ્થ સ્ટોક",
        "lowStock": "ઓછો સ્ટોક",
        "critical": "ગંભીર",
        "deadStock": "ડેડ સ્ટોક",
        "addToCart": "કાર્ટમાં ઉમેરો",
        "buyNow": "હમણાં ખરીદો",
        "price": "કિંમત",
        "stock": "સ્ટોક",
        "status": "સ્થિતિ",
        "actions": "ક્રિયાઓ",
        "update": "અપડેટ",
        "cancel": "રદ કરો",
        "save": "સાચવો"
      },
      "dashboard": {
        "welcome": "સ્વાગત છે",
        "salesToday": "આજનું વેચાણ",
        "revenue": "આવક",
        "recentOrders": "તાજેતરના ઓર્ડર્સ",
        "topProducts": "ટોચના ઉત્પાદનો"
      }
    }
  },
  bn: {
    translation: {
      "nav": {
        "home": "হোম",
        "products": "পণ্য",
        "myProducts": "আমার পণ্য",
        "myOrders": "আমার অর্ডার",
        "orders": "অর্ডার",
        "deals": "ডিলস",
        "dashboard": "ড্যাশবোর্ড",
        "inventory": "তালিকা",
        "customers": "গ্রাহকগণ",
        "retailers": "খুচরা বিক্রেতা",
        "settings": "সেটিংস",
        "logout": "লগ আউট",
        "notifications": "বিজ্ঞপ্তি"
      },
      "common": {
        "search": "অনুসন্ধান",
        "language": "ভাষা",
        "totalProducts": "মোট পণ্য",
        "healthyStock": "সুস্থ স্টক",
        "lowStock": "কম স্টক",
        "critical": "গুরুতর",
        "deadStock": "ডেড স্টক",
        "addToCart": "কার্টে যোগ করুন",
        "buyNow": "এখনই কিনুন",
        "price": "মূল্য",
        "stock": "স্টক",
        "status": "অবস্থা",
        "actions": "কর্ম",
        "update": "আপডেট",
        "cancel": "বাতিল",
        "save": "সংরক্ষণ করুন"
      },
      "dashboard": {
        "welcome": "স্বাগতম",
        "salesToday": "আজকের বিক্রয়",
        "revenue": "রাজস্ব",
        "recentOrders": "সাম্প্রতিক অর্ডার",
        "topProducts": "শীর্ষ পণ্য"
      }
    }
  },
  ta: {
    translation: {
      "nav": {
        "home": "முகப்பு",
        "products": "தயாரிப்புகள்",
        "myProducts": "என் தயாரிப்புகள்",
        "myOrders": "என் ஆர்டர்கள்",
        "orders": "ஆர்டர்கள்",
        "deals": "சலுகைகள்",
        "dashboard": "முகப்புப்பலகை",
        "inventory": "சரக்கு",
        "customers": "வாடிக்கையாளர்கள்",
        "retailers": "சில்லறை விற்பனையாளர்கள்",
        "settings": "அமைப்புகள்",
        "logout": "வெளியேறு",
        "notifications": "அறிவிப்புகள்"
      },
      "common": {
        "search": "தேடல்",
        "language": "மொழி",
        "totalProducts": "மொத்த தயாரிப்புகள்",
        "healthyStock": "ஆரோக்கியமான இருப்பு",
        "lowStock": "குறைந்த இருப்பு",
        "critical": "முக்கியமானது",
        "deadStock": "இறந்த இருப்பு",
        "addToCart": "கூடையில் சேர்",
        "buyNow": "இப்போது வாங்கு",
        "price": "விலை",
        "stock": "இருப்பு",
        "status": "நிலை",
        "actions": "செயல்கள்",
        "update": "புதுப்பி",
        "cancel": "ரத்துசெய்",
        "save": "சேமி"
      },
      "dashboard": {
        "welcome": "மீண்டும் வருக",
        "salesToday": "இன்றைய விற்பனை",
        "revenue": "வருவாய்",
        "recentOrders": "சமீபத்திய ஆர்டர்கள்",
        "topProducts": "சிறந்த தயாரிப்புகள்"
      }
    }
  },
  te: {
    translation: {
      "nav": {
        "home": "హోమ్",
        "products": "ఉత్పత్తులు",
        "myProducts": "నా ఉత్పత్తులు",
        "myOrders": "నా ఆజ్ఞలు",
        "orders": "ఆజ్ఞలు",
        "deals": "ఆఫర్‌లు",
        "dashboard": "డాష్‌బోర్డ్",
        "inventory": "వస్తువుల చిట్టా",
        "customers": "కస్టమర్లు",
        "retailers": "రిటైలర్లు",
        "settings": "సెట్టింగులు",
        "logout": "లాగ్ అవుట్",
        "notifications": "నోటిఫికేషన్లు"
      },
      "common": {
        "search": "శోధన",
        "language": "భాష",
        "totalProducts": "మొత్తం ఉత్పత్తులు",
        "healthyStock": "ఆరోగ్యకరమైన స్టాక్",
        "lowStock": "అల్ప స్టాక్",
        "critical": "క్లిష్టమైన",
        "deadStock": "డెడ్ స్టాక్",
        "addToCart": "కార్ట్‌కు జోడించు",
        "buyNow": "ఇప్పుడే కొనండి",
        "price": "ధర",
        "stock": "స్టాక్",
        "status": "స్థితి",
        "actions": "చర్యలు",
        "update": "నవీకరించు",
        "cancel": "రద్దు",
        "save": "సేవ్"
      },
      "dashboard": {
        "welcome": "తిరిగి స్వాగతం",
        "salesToday": "ఈ రోజు విక్రయాలు",
        "revenue": "ఆదాయం",
        "recentOrders": "ఇటీవలి ఆర్డర్‌లు",
        "topProducts": "టాప్ ఉత్పత్తులు"
      }
    }
  },
  kn: {
    translation: {
      "nav": {
        "home": "ಮುಖಪುಟ",
        "products": "ಉತ್ಪನ್ನಗಳು",
        "myProducts": "ನನ್ನ ಉತ್ಪನ್ನಗಳು",
        "myOrders": "ನನ್ನ ಆದೇಶಗಳು",
        "orders": "ಆದೇಶಗಳು",
        "deals": "ಡೀಲ್‌ಗಳು",
        "dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        "inventory": "ದಾಸ್ತಾನು",
        "customers": "ಗ್ರಾಹಕರು",
        "retailers": "ಚಿಲ್ಲರೆ ವ್ಯಾಪಾರಿಗಳು",
        "settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
        "logout": "ಲಾಗ್ ಔಟ್",
        "notifications": "ಅಧಿಸೂಚನೆಗಳು"
      },
      "common": {
        "search": "ಹುಡುಕಾಟ",
        "language": "ಭಾಷೆ",
        "totalProducts": "ಒಟ್ಟು ಉತ್ಪನ್ನಗಳು",
        "healthyStock": "ಆರೋಗ್ಯಕರ ಸ್ಟಾಕ್",
        "lowStock": "ಕಡಿಮೆ ಸ್ಟಾಕ್",
        "critical": "ನಿರ್ಣಾಯಕ",
        "deadStock": "ಡೆಡ್ ಸ್ಟಾಕ್",
        "addToCart": "ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಿ",
        "buyNow": "ಈಗ ಖರೀದಿಸಿ",
        "price": "ಬೆಲೆ",
        "stock": "ಸ್ಟಾಕ್",
        "status": "ಸ್ಥಿತಿ",
        "actions": "ಕ್ರಿಯೆಗಳು",
        "update": "ನವೀಕರಿಸಿ",
        "cancel": "ರದ್ದುಮಾಡಿ",
        "save": "ಉಳಿಸಿ"
      },
      "dashboard": {
        "welcome": "ಮತ್ತೆ ಸ್ವಾಗತ",
        "salesToday": "ಇಂದಿನ ಮಾರಾಟ",
        "revenue": "ಆದಾಯ",
        "recentOrders": "ಇತ್ತೀಚಿನ ಆದೇಶಗಳು",
        "topProducts": "ಟಾಪ್ ಉತ್ಪನ್ನಗಳು"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
