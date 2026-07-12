'use client'

import { createContext, useCallback, useContext, useLayoutEffect, useEffect, useState } from "react"
import type { ReactNode } from "react"

const LNG_KEY = 'cv-lang'

const translations: Record<string, { en: string; np: string }> = {
  'hero.badge': { en: 'Nagarik Aawaz — CivicVoice', np: 'नागरिक आवाज — CivicVoice' },
  'hero.heading': { en: 'Report Local Issues.<br>Track Their Progress.', np: 'स्थानीय समस्या रिपोर्ट गर्नुहोस्।<br>समाधानको दिशा सँगै पछ्याउनुहोस्।' },
  'hero.desc': { en: 'Small actions create better neighbourhoods. Snap a photo, report an issue, and follow up with your ward office — all in one place.', np: 'साना प्रयासहरूले समाजलाई राम्रो बनाउँछ। फोटो खिच्नुहोस्, समस्या रिपोर्ट गर्नुहोस्, र आफ्नो वडा कार्यालयसँग अनुगमन गर्नुहोस् — सबै एकै ठाउँमा।' },
  'hero.reportBtn': { en: 'Report an Issue', np: 'समस्या रिपोर्ट गर्नुहोस्' },
  'hero.exploreBtn': { en: 'Explore Community Feed', np: 'सामुदायिक फिड हेर्नुहोस्' },
  'stat.issuesReported': { en: 'Issues Reported', np: 'रिपोर्ट गरिएका समस्याहरू' },
  'stat.issuesReported.desc': { en: 'from potholes to water leaks', np: 'खाल्डाखुल्डीदेखि पानी चुहावटसम्म' },
  'stat.issuesResolved': { en: 'Issues Resolved', np: 'समाधान भएका समस्याहरू' },
  'stat.issuesResolved.desc': { en: 'track record of action', np: 'कारबाहीको अभिलेख' },
  'stat.wardsCovered': { en: 'Wards Covered', np: 'समेटिएका वडाहरू' },
  'stat.wardsCovered.desc': { en: 'across Kathmandu valley', np: 'काठमाडौं उपत्यकाभर' },
  'stat.members': { en: 'Community Members', np: 'समुदायका सदस्यहरू' },
  'stat.members.desc': { en: 'neighbours helping neighbours', np: 'छिमेकीको सहयोग' },
  'stat.communityMembers': { en: 'Community Members', np: 'समुदायका सदस्यहरू' },
  'stat.communityMembers.desc': { en: 'neighbours helping neighbours', np: 'छिमेकीको सहयोग' },
  'page.about': { en: 'About CivicVoice', np: 'CivicVoice बारे' },
  'page.about.subtitle': { en: 'Bridging the gap between citizens and local government through transparent issue reporting.', np: 'पारदर्शी रिपोर्टिङमार्फत नागरिक र स्थानीय सरकारबीचको दूरी कम गर्दै।' },
  'page.contact': { en: 'Contact Us', np: 'सम्पर्क गर्नुहोस्' },
  'page.contact.subtitle': { en: 'Have a question, suggestion, or need help? We\'d love to hear from you.', np: 'प्रश्न, सुझाव वा सहायता चाहिन्छ? हामी सुन्न तयार छौं।' },
  'page.faq': { en: 'Frequently Asked Questions', np: 'बारम्बार सोधिने प्रश्नहरू' },
  'page.faq.subtitle': { en: 'Everything you need to know about using CivicVoice.', np: 'CivicVoice प्रयोग गर्ने बारेमा जान्नुपर्ने सबै कुरा।' },
  'page.notices.subtitle': { en: 'Latest announcements and updates from Kathmandu ward offices.', np: 'काठमाडौं वडा कार्यालयहरूबाट नवीनतम सूचना र अद्यावधिकहरू।' },
  'page.privacy': { en: 'Privacy Policy', np: 'गोपनीयता नीति' },
  'page.terms': { en: 'Terms & Conditions', np: 'सर्तहरू' },
  'nav.home': { en: 'Home', np: 'गृह पृष्ठ' },
  'nav.feed': { en: 'Community Feed', np: 'सामुदायिक फिड' },
  'nav.map': { en: 'Explore Map', np: 'नक्सा हेर्नुहोस्' },
  'nav.submit': { en: 'Submit Report', np: 'रिपोर्ट पेश गर्नुहोस्' },
  'nav.profile': { en: 'User Profile', np: 'प्रोफाइल' },
  'nav.login': { en: 'Login', np: 'लगइन' },
  'nav.signup': { en: 'Sign Up', np: 'साइन अप' },
  'nav.search': { en: 'Search...', np: 'खोज्नुहोस्...' },
  'home.recentReports': { en: 'Recent Community Reports', np: 'हालैका सामुदायिक रिपोर्टहरू' },
  'home.viewAll': { en: 'View All', np: 'सबै हेर्नुहोस्' },
  'home.wardActivity': { en: 'Ward-wise Activity', np: 'वडागत गतिविधि' },
  'home.viewAllWards': { en: 'View All Wards', np: 'सबै वडा हेर्नुहोस्' },
  'home.howItWorks': { en: 'How It Works', np: 'यसरी काम गर्छ' },
  'home.howToReport': { en: 'How to Report an Issue', np: 'समस्या कसरी रिपोर्ट गर्ने' },
  'home.browseCategory': { en: 'Browse by Category', np: 'श्रेणी अनुसार हेर्नुहोस्' },
  'home.mission': { en: 'Our Mission', np: 'हाम्रो उद्देश्य' },
  'home.mission.heading': { en: 'Making Kathmandu more responsive, one report at a time', np: 'एक रिपोर्ट, एक परिवर्तन — काठमाडौंलाई अझै उत्तरदायी बनाउँदै' },
  'home.notices': { en: 'Official Notices', np: 'आधिकारिक सूचनाहरू' },
  'home.exploreMap': { en: "See what's happening around you", np: 'आफ्नो वरपर के भइरहेको छ हेर्नुहोस्' },
  'home.emergency': { en: 'Emergency Contacts', np: 'आपतकालीन सम्पर्क' },
  'home.faq': { en: 'Common Questions', np: 'सामान्य प्रश्नहरू' },
  'hiw.step1.title': { en: 'Report an Issue', np: 'समस्या रिपोर्ट गर्नुहोस्' },
  'hiw.step1.desc': { en: 'Snap a photo, pin the location, describe what\'s wrong.', np: 'फोटो खिच्नुहोस्, स्थान चिह्नित गर्नुहोस्, समस्या वर्णन गर्नुहोस्।' },
  'hiw.step2.title': { en: 'Community Verification', np: 'सामुदायिक पुष्टि' },
  'hiw.step2.desc': { en: 'Neighbours verify and upvote reports to prioritise what matters.', np: 'छिमेकीहरूले रिपोर्ट प्रमाणित गरी महत्वपूर्ण समस्यालाई प्राथमिकता दिन्छन्।' },
  'hiw.step3.title': { en: 'Official Review', np: 'आधिकारिक समीक्षा' },
  'hiw.step3.desc': { en: 'Your ward office reviews, assigns a team, and posts updates.', np: 'वडा कार्यालयले समीक्षा गरी टोली खटाउँछ र अद्यावधिक गर्छ।' },
  'hiw.step4.title': { en: 'Resolution', np: 'समाधान' },
  'hiw.step4.desc': { en: 'Issue resolved and closed — publicly visible for accountability.', np: 'समस्या समाधान भई बन्द — सार्वजनिक रूपमा देखिने।' },
  'status.open': { en: 'Open', np: 'खुला' },
  'status.inProgress': { en: 'In Progress', np: 'प्रगतिमा' },
  'status.resolved': { en: 'Resolved', np: 'समाधान भयो' },
  'cat.road': { en: 'Road Damage', np: 'सडक क्षति' },
  'cat.waste': { en: 'Waste Management', np: 'फोहोर व्यवस्थापन' },
  'cat.water': { en: 'Water Supply', np: 'खानेपानी' },
  'cat.streetlight': { en: 'Street Lights', np: 'सडक बत्ती' },
  'cat.drainage': { en: 'Drainage', np: 'निकास' },
  'cat.health': { en: 'Public Health', np: 'सार्वजनिक स्वास्थ्य' },
  'cat.safety': { en: 'Public Safety', np: 'सार्वजनिक सुरक्षा' },
  'cat.traffic': { en: 'Traffic', np: 'ट्राफिक' },
  'cat.environment': { en: 'Environment', np: 'वातावरण' },
  'cat.sanitation': { en: 'Sanitation', np: 'सरसफाइ' },
  'cat.infrastructure': { en: 'Infrastructure', np: 'पूर्वाधार' },
  'cat.other': { en: 'Others', np: 'अन्य' },
  'wards.title': { en: 'Ward-wise Activity', np: 'वडागत गतिविधि' },
  'wards.subtitle': { en: 'Breakdown of reported issues across all 32 wards of Kathmandu, categorised by resolution rate.', np: 'काठमाडौंका ३२ वटै वडाका रिपोर्ट गरिएका समस्याहरूको विवरण, समाधान दरअनुसार वर्गीकृत।' },
  'wards.wellResolved': { en: 'Well Resolved', np: 'राम्रो समाधान' },
  'wards.wellResolved.desc': { en: 'Wards with 65% or higher resolution rate — responsive and efficient.', np: '६५% वा सोभन्दा माथि समाधान दर भएका वडाहरू — उत्तरदायी र प्रभावकारी।' },
  'wards.onTrack': { en: 'On Track', np: 'सुधार हुँदै' },
  'wards.onTrack.desc': { en: 'Wards with resolution rates between 50% and 64% — making steady progress.', np: '५०% देखि ६४% सम्म समाधान दर भएका वडाहरू — नियमित प्रगति गरिरहेका।' },
  'wards.needsAttention': { en: 'Needs Attention', np: 'ध्यानाकर्षण आवश्यक' },
  'wards.needsAttention.desc': { en: 'Wards with resolution rates below 50% — these need more active community reporting.', np: '५०% भन्दा कम समाधान दर भएका वडाहरू — यहाँ बढी सक्रिय रिपोर्टिङ आवश्यक।' },
  'wards.issues': { en: 'issues', np: 'समस्याहरू' },
  'wards.resolved': { en: 'resolved', np: 'समाधान' },
  'wards.inReview': { en: 'in review', np: 'समीक्षामा' },
  'wards.open': { en: 'open', np: 'खुला' },
  'wards.viewReports': { en: 'View Reports', np: 'रिपोर्ट हेर्नुहोस्' },
  'wards.goToApp': { en: 'Go to App', np: 'एपमा जानुहोस्' },
  'feed.allIssues': { en: 'All Issues', np: 'सबै समस्याहरू' },
  'feed.mostRecent': { en: 'Most Recent', np: 'नयाँ' },
  'feed.mostUpvoted': { en: 'Most Upvoted', np: 'बढी मत' },
  'feed.filter': { en: 'Filter', np: 'फिल्टर' },
  'feed.filterApplied': { en: 'filter applied', np: 'फिल्टर लागू' },
  'feed.filtersApplied': { en: 'filters applied', np: 'फिल्टरहरू लागू' },
  'feed.status': { en: 'Status', np: 'स्थिति' },
  'feed.ward': { en: 'Ward', np: 'वडा' },
  'feed.category': { en: 'Category', np: 'श्रेणी' },
  'feed.reset': { en: 'Reset', np: 'रिसेट' },
  'feed.apply': { en: 'Apply Filters', np: 'फिल्टर लागू गर्नुहोस्' },
  'submit.heading': { en: 'Report a Community Issue', np: 'सामुदायिक समस्या रिपोर्ट गर्नुहोस्' },
  'submit.submitTab': { en: 'Submit New Report', np: 'नयाँ रिपोर्ट पेश गर्नुहोस्' },
  'submit.yourReports': { en: 'View Your Reports', np: 'आफ्ना रिपोर्टहरू हेर्नुहोस्' },
  'submit.title': { en: 'Issue Title', np: 'समस्याको शीर्षक' },
  'submit.category': { en: 'Issue Category', np: 'समस्याको श्रेणी' },
  'submit.selectCat': { en: 'Select Category', np: 'श्रेणी छान्नुहोस्' },
  'submit.description': { en: 'Description', np: 'विवरण' },
  'submit.ward': { en: 'Ward Number', np: 'वडा नम्बर' },
  'submit.priority': { en: 'Priority Level', np: 'प्राथमिकता स्तर' },
  'submit.location': { en: 'Location', np: 'स्थान' },
  'submit.upload': { en: 'Upload Photos / Videos', np: 'फोटो / भिडियो अपलोड गर्नुहोस्' },
  'submit.anonymous': { en: 'Report Anonymously', np: 'गोप्य रूपमा रिपोर्ट गर्नुहोस्' },
  'submit.guidelines': { en: 'Community Guidelines', np: 'सामुदायिक दिशानिर्देश' },
  'submit.submitBtn': { en: 'Submit Report', np: 'रिपोर्ट पेश गर्नुहोस्' },
  'auth.welcome': { en: 'Welcome back. Sign in to continue.', np: 'पुनः स्वागत छ। जारी राख्न लगइन गर्नुहोस्।' },
  'auth.phone': { en: 'Phone Number', np: 'फोन नम्बर' },
  'auth.password': { en: 'Password', np: 'पासवर्ड' },
  'auth.remember': { en: 'Remember Me', np: 'मलाई सम्झनुहोस्' },
  'auth.forgot': { en: 'Forgot Password?', np: 'पासवर्ड बिर्सनुभयो?' },
  'auth.login': { en: 'Login', np: 'लगइन' },
  'auth.signup': { en: 'Create Account', np: 'खाता बनाउनुहोस्' },
  'auth.noAccount': { en: "Don't have an account? Sign Up", np: 'खाता छैन? साइन अप गर्नुहोस्' },
  'auth.citizen': { en: 'Citizen', np: 'नागरिक' },
  'auth.official': { en: 'Official', np: 'अधिकारी' },
  'auth.verifyCode': { en: 'Verification Code', np: 'प्रमाणीकरण कोड' },
  'auth.sendCode': { en: 'Send Code', np: 'कोड पठाउनुहोस्' },
  'auth.displayName': { en: 'Display Name', np: 'प्रदर्शन नाम' },
  'auth.confirmPw': { en: 'Confirm Password', np: 'पासवर्ड पुष्टि गर्नुहोस्' },
  'auth.agreeTerms': { en: 'I agree to the Terms & Conditions', np: 'म सर्तहरूसँग सहमत छु' },
  'auth.hasAccount': { en: 'Already have an account? Login', np: 'पहिल्यै खाता छ? लगइन गर्नुहोस्' },
  'map.title': { en: 'Issue Map — Kathmandu', np: 'समस्या नक्सा — काठमाडौं' },
  'map.viewBtn': { en: 'Report Issue', np: 'समस्या रिपोर्ट गर्नुहोस्' },
  'profile.reports': { en: 'Reports', np: 'रिपोर्टहरू' },
  'profile.resolved': { en: 'Resolved', np: 'समाधान' },
  'profile.upvotes': { en: 'Upvotes', np: 'मत' },
  'profile.badges': { en: 'Badges', np: 'ब्याज' },
  'profile.accessibility': { en: 'Accessibility', np: 'पहुँचयोग्यता' },
  'profile.account': { en: 'Account', np: 'खाता' },
  'profile.accountCreated': { en: 'Account Created', np: 'खाता सिर्जना गरियो' },
  'profile.accountDeactivated': { en: 'Account deactivated.', np: 'खाता निष्क्रिय गरियो।' },
  'profile.accountDeleted': { en: 'Account deleted.', np: 'खाता मेटियो।' },
  'profile.activity': { en: 'Activity', np: 'गतिविधि' },
  'profile.activityDownloaded': { en: 'Activity history downloaded.', np: 'गतिविधि इतिहास डाउनलोड गरियो।' },

  'profile.app': { en: 'App', np: 'एप' },
  'profile.approvedFollowersOnly': { en: 'Approved Followers Only', np: 'स्वीकृत अनुयायीहरू मात्र' },
  'profile.attachLocation': { en: 'Attach location automatically', np: 'स्वचालित रूपमा स्थान संलग्न गर्नुहोस्' },
  'profile.autoCenter': { en: 'Automatically center map on my location', np: 'स्वचालित रूपमा नक्सा मेरो स्थानमा केन्द्रित गर्नुहोस्' },
  'profile.autoHideLowQuality': { en: 'Auto-hide low quality reports', np: 'कम गुणस्तरका रिपोर्टहरू स्वतः लुकाउनुहोस्' },
  'profile.autoSaveDrafts': { en: 'Auto-save report drafts', np: 'रिपोर्ट मस्यौदा स्वतः सुरक्षित गर्नुहोस्' },
  'profile.badgesEarned': { en: 'Badges Earned', np: 'प्राप्त ब्याजहरू' },
  'profile.bioAboutMe': { en: 'Bio / About Me', np: 'जीवनी / मेरो बारे' },
  'profile.blurLocation': { en: 'Blur location automatically', np: 'स्वचालित रूपमा स्थान धमिलो गर्नुहोस्' },
  'profile.cancel': { en: 'Cancel', np: 'रद्द गर्नुहोस्' },
  'profile.change': { en: 'Change', np: 'परिवर्तन गर्नुहोस्' },
  'profile.changePassword': { en: 'Change Password', np: 'पासवर्ड परिवर्तन गर्नुहोस्' },
  'profile.changeRequested': { en: 'Phone change requested.', np: 'फोन परिवर्तन अनुरोध गरियो।' },
  'profile.chooseNotifications': { en: 'Choose what notifications you receive.', np: 'तपाईंले प्राप्त गर्ने सूचनाहरू छान्नुहोस्।' },
  'profile.civicNotifications': { en: 'Civic Notifications', np: 'नागरिक सूचनाहरू' },
  'profile.colorBlindMode': { en: 'Color Blind Mode', np: 'रङ अन्धोपन मोड' },
  'profile.comments': { en: 'Comments', np: 'टिप्पणीहरू' },
  'profile.community': { en: 'Community', np: 'समुदाय' },
  'profile.communityRank': { en: 'Community Rank', np: 'सामुदायिक क्रम' },
  'profile.communityUpdates': { en: 'Community updates', np: 'सामुदायिक अद्यावधिकहरू' },
  'profile.configureReporting': { en: 'Configure your default reporting behavior.', np: 'आफ्नो पूर्वनिर्धारित रिपोर्टिङ व्यवहार कन्फिगर गर्नुहोस्।' },
  'profile.contributionScore': { en: 'Contribution Score', np: 'योगदान स्कोर' },
  'profile.controlPrivacy': { en: 'Control your privacy and safety on CivicVoice.', np: 'CivicVoice मा आफ्नो गोपनीयता र सुरक्षा नियन्त्रण गर्नुहोस्।' },
  'profile.customizeViewing': { en: 'Customize your viewing experience.', np: 'आफ्नो दृश्य अनुभव अनुकूलित गर्नुहोस्।' },
  'profile.dataExportEmailed': { en: 'Your data export will be emailed to you.', np: 'तपाईंको डेटा निर्यात इमेल गरिनेछ।' },
  'profile.dataSecurity': { en: 'Data & Security', np: 'डेटा र सुरक्षा' },
  'profile.days': { en: 'days', np: 'दिन' },
  'profile.deactivateAccount': { en: 'Deactivate Account', np: 'खाता निष्क्रिय गर्नुहोस्' },
  'profile.defaultFeedSort': { en: 'Default feed sorting', np: 'पूर्वनिर्धारित फिड क्रमबद्धता' },
  'profile.defaultHomeLocation': { en: 'Default Home Location', np: 'पूर्वनिर्धारित गृह स्थान' },
  'profile.defaultMapType': { en: 'Default map type', np: 'पूर्वनिर्धारित नक्सा प्रकार' },
  'profile.defaultMapZoom': { en: 'Default map zoom level', np: 'पूर्वनिर्धारित नक्सा जुम स्तर' },
  'profile.defaultReportPriority': { en: 'Default report priority', np: 'पूर्वनिर्धारित रिपोर्ट प्राथमिकता' },
  'profile.defaultReportVisibility': { en: 'Default report visibility', np: 'पूर्वनिर्धारित रिपोर्ट दृश्यता' },
  'profile.deleteAccount': { en: 'Delete Account', np: 'खाता मेट्नुहोस्' },
  'profile.deleteConfirm': { en: 'Are you sure? This cannot be undone.', np: 'के तपाईं निश्चित हुनुहुन्छ? यसलाई पूर्ववत गर्न सकिँदैन।' },
  'profile.deliveryMethods': { en: 'Delivery Methods', np: 'डेलिभरी विधिहरू' },
  'profile.downloadActivityHistory': { en: 'Download Activity History', np: 'गतिविधि इतिहास डाउनलोड गर्नुहोस्' },
  'profile.downloadMyData': { en: 'Download My Data', np: 'मेरो डेटा डाउनलोड गर्नुहोस्' },
  'profile.downloadSavedLocations': { en: 'Download Saved Locations', np: 'सुरक्षित स्थानहरू डाउनलोड गर्नुहोस्' },
  'profile.dyslexiaFriendlyFont': { en: 'Dyslexia Friendly Font', np: 'डिस्लेक्सिया मैत्री फन्ट' },
  'profile.editProfile': { en: 'Edit Profile', np: 'प्रोफाइल सम्पादन गर्नुहोस्' },
  'profile.emailAddress': { en: 'Email Address', np: 'इमेल ठेगाना' },
  'profile.emailChangeRequested': { en: 'Email change requested.', np: 'इमेल परिवर्तन अनुरोध गरियो।' },
  'profile.emailNotifications': { en: 'Email notifications', np: 'इमेल सूचनाहरू' },
  'profile.enableLiveLocation': { en: 'Enable live location while reporting', np: 'रिपोर्ट गर्दा लाइभ स्थान सक्षम गर्नुहोस्' },
  'profile.english': { en: 'English', np: 'अङ्ग्रेजी' },
  'profile.everyone': { en: 'Everyone', np: 'सबै' },
  'profile.exportReports': { en: 'Export Reports', np: 'रिपोर्टहरू निर्यात गर्नुहोस्' },
  'profile.extraLarge': { en: 'Extra Large', np: 'अतिरिक्त ठूलो' },
  'profile.fineTuneFeed': { en: 'Fine-tune your community feed experience.', np: 'आफ्नो सामुदायिक फिड अनुभवलाई राम्रो बनाउनुहोस्।' },
  'profile.followers': { en: 'Followers', np: 'अनुयायीहरू' },
  'profile.following': { en: 'Following', np: 'पछ्याउँदै' },
  'profile.follows': { en: 'Follows', np: 'अनुसरणहरू' },
  'profile.fontSize': { en: 'Font Size', np: 'फन्ट आकार' },
  'profile.hideActivityHistory': { en: 'Hide activity history', np: 'गतिविधि इतिहास लुकाउनुहोस्' },
  'profile.hideDuplicates': { en: 'Hide duplicate reports', np: 'नक्कल रिपोर्टहरू लुकाउनुहोस्' },
  'profile.hideExactCoordinates': { en: 'Hide exact coordinates', np: 'सटीक निर्देशांक लुकाउनुहोस्' },
  'profile.hideFollowerCount': { en: 'Hide follower count', np: 'अनुयायी गणना लुकाउनुहोस्' },
  'profile.hidePhotoInAnonymous': { en: 'Hide profile photo in anonymous reports', np: 'गोप्य रिपोर्टहरूमा प्रोफाइल फोटो लुकाउनुहोस्' },
  'profile.hideRealName': { en: 'Hide real name', np: 'वास्तविक नाम लुकाउनुहोस्' },
  'profile.hideSavedReports': { en: 'Hide saved reports', np: 'सुरक्षित रिपोर्टहरू लुकाउनुहोस्' },
  'profile.hideUpvotedReports': { en: 'Hide upvoted reports', np: 'मत प्राप्त रिपोर्टहरू लुकाउनुहोस्' },
  'profile.high': { en: 'High', np: 'उच्च' },
  'profile.highContrastMode': { en: 'High Contrast Mode', np: 'उच्च कन्ट्रास्ट मोड' },
  'profile.hindi': { en: 'Hindi', np: 'हिन्दी' },
  'profile.hybrid': { en: 'Hybrid', np: 'हाइब्रिड' },
  'profile.identity': { en: 'Identity', np: 'पहिचान' },
  'profile.interaction': { en: 'Interaction', np: 'अन्तरक्रिया' },
  'profile.interests': { en: 'Interests', np: 'रुचिहरू' },
  'profile.km': { en: 'km', np: 'किमि' },
  'profile.languageSelection': { en: 'Language Selection', np: 'भाषा चयन' },
  'profile.languagesSpoken': { en: 'Languages Spoken', np: 'बोलिने भाषाहरू' },
  'profile.large': { en: 'Large', np: 'ठूलो' },
  'profile.location': { en: 'Location', np: 'स्थान' },
  'profile.locationsDownloaded': { en: 'Saved locations downloaded.', np: 'सुरक्षित स्थानहरू डाउनलोड गरियो।' },
  'profile.loggedOut': { en: 'Logged out of all devices.', np: 'सबै उपकरणबाट लग आउट गरियो।' },
  'profile.loginActivity': { en: 'Login Activity', np: 'लगइन गतिविधि' },
  'profile.logoutAllDevices': { en: 'Logout From All Devices', np: 'सबै उपकरणबाट लगआउट गर्नुहोस्' },
  'profile.logoutConfirm': { en: 'Log out of all devices?', np: 'सबै उपकरणबाट लग आउट गर्ने?' },
  'profile.low': { en: 'Low', np: 'कम' },
  'profile.manageAccountInfo': { en: 'Manage your account information and security.', np: 'आफ्नो खाता जानकारी र सुरक्षा व्यवस्थापन गर्नुहोस्।' },
  'profile.manageData': { en: 'Manage your data and account security.', np: 'आफ्नो डेटा र खाता सुरक्षा व्यवस्थापन गर्नुहोस्।' },
  'profile.mapPlatform': { en: 'Since your platform revolves around maps.', np: 'तपाईंको प्लेटफर्म नक्सामा आधारित छ।' },
  'profile.mapPreferences': { en: 'Map Preferences', np: 'नक्सा प्राथमिकताहरू' },
  'profile.medium': { en: 'Medium', np: 'मध्यम' },
  'profile.memberSince': { en: 'Member since', np: 'सदस्यता मिति' },
  'profile.mentions': { en: 'Mentions', np: 'उल्लेखहरू' },
  'profile.municipalityCity': { en: 'Municipality / City', np: 'नगरपालिका / सहर' },
  'profile.municipalityResponses': { en: 'Municipality responses', np: 'नगरपालिका प्रतिक्रियाहरू' },
  'profile.nearby': { en: 'Nearby', np: 'नजिकै' },
  'profile.nearbyIssueAlerts': { en: 'Nearby issue alerts', np: 'नजिकैको समस्या सूचनाहरू' },
  'profile.nepali': { en: 'Nepali', np: 'नेपाली' },
  'profile.new': { en: 'New', np: 'नयाँ' },
  'profile.newPassword': { en: 'New password', np: 'नयाँ पासवर्ड' },
  'profile.nobody': { en: 'Nobody', np: 'कोही पनि' },
  'profile.noComments': { en: 'No comments yet.', np: 'अहिलेसम्म कुनै टिप्पणी छैन।' },
  'profile.noReports': { en: 'No reports yet. Start making a difference!', np: 'अहिलेसम्म कुनै रिपोर्ट छैन। परिवर्तन सुरु गर्नुहोस्!' },
  'profile.noSaved': { en: 'No saved reports yet.', np: 'अहिलेसम्म कुनै सुरक्षित रिपोर्ट छैन।' },
  'profile.notifications': { en: 'Notifications', np: 'सूचनाहरू' },
  'profile.nsfwFilter': { en: 'NSFW/Graphic content filter', np: 'NSFW/ग्राफिक सामग्री फिल्टर' },
  'profile.off': { en: 'Off', np: 'बन्द' },
  'profile.phoneNumber': { en: 'Phone Number', np: 'फोन नम्बर' },
  'profile.points': { en: 'points', np: 'अङ्क' },
  'profile.preferredRadius': { en: 'Preferred Radius', np: 'अभिप्रेत दायरा' },
  'profile.privacySafety': { en: 'Privacy & Safety', np: 'गोपनीयता र सुरक्षा' },
  'profile.private': { en: 'Private', np: 'निजी' },
  'profile.profileVisibility': { en: 'Profile Visibility', np: 'प्रोफाइल दृश्यता' },
  'profile.public': { en: 'Public', np: 'सार्वजनिक' },
  'profile.pushNotifications': { en: 'Push notifications', np: 'पुश सूचनाहरू' },
  'profile.reduceAnimations': { en: 'Reduce Animations', np: 'एनिमेसन घटाउनुहोस्' },
  'profile.rememberCategory': { en: 'Remember previous category', np: 'अघिल्लो श्रेणी सम्झनुहोस्' },
  'profile.replies': { en: 'Replies', np: 'जवाफहरू' },
  'profile.reportAnonymously': { en: 'Report anonymously by default', np: 'पूर्वनिर्धारित रूपमा गोप्य रिपोर्ट गर्नुहोस्' },
  'profile.reportStatusChanges': { en: 'Report status changes', np: 'रिपोर्ट स्थिति परिवर्तनहरू' },
  'profile.reporting': { en: 'Reporting', np: 'रिपोर्टिङ' },
  'profile.reportsExported': { en: 'Your reports have been exported.', np: 'तपाईंका रिपोर्टहरू निर्यात गरिएका छन्।' },
  'profile.reportsResolved': { en: 'Reports Resolved', np: 'समाधान गरिएका रिपोर्टहरू' },
  'profile.reportsSubmitted': { en: 'Reports Submitted', np: 'पेश गरिएका रिपोर्टहरू' },
  'profile.reputation': { en: 'Reputation', np: 'प्रतिष्ठा' },
  'profile.requestVerification': { en: 'Request Account Verification', np: 'खाता प्रमाणीकरण अनुरोध गर्नुहोस्' },
  'profile.saveChanges': { en: 'Save Changes', np: 'परिवर्तनहरू सुरक्षित गर्नुहोस्' },
  'profile.saveFavorites': { en: 'Save favorite places', np: 'मनपर्ने स्थानहरू सुरक्षित गर्नुहोस्' },
  'profile.saveFrequentLocations': { en: 'Save frequently visited locations', np: 'बारम्बार भ्रमण गरिएका स्थानहरू सुरक्षित गर्नुहोस्' },
  'profile.satellite': { en: 'Satellite', np: 'स्याटेलाइट' },
  'profile.screenReaderOptimization': { en: 'Screen Reader Optimization', np: 'स्क्रिन रिडर अनुकूलन' },
  'profile.searchLocation': { en: 'Search location', np: 'स्थान खोज्नुहोस्' },
  'profile.showMunicipality': { en: 'Show municipality publicly', np: 'नगरपालिका सार्वजनिक रूपमा देखाउनुहोस्' },
  'profile.showWard': { en: 'Show ward publicly', np: 'वडा सार्वजनिक रूपमा देखाउनुहोस्' },
  'profile.small': { en: 'Small', np: 'सानो' },
  'profile.sms': { en: 'SMS', np: 'एसएमएस' },
  'profile.smsNotifications': { en: 'SMS notifications', np: 'एसएमएस सूचनाहरू' },
  'profile.socialNotifications': { en: 'Social Notifications', np: 'सामाजिक सूचनाहरू' },
  'profile.streak': { en: 'Streak', np: 'लगातार' },
  'profile.street': { en: 'Street', np: 'सडक' },
  'profile.trending': { en: 'Trending', np: 'ट्रेन्डिङ' },
  'profile.twoFactorAuth': { en: 'Two-Factor Authentication (2FA)', np: 'दुई-कारक प्रमाणीकरण (2FA)' },
  'profile.verificationStatus': { en: 'Verification Status', np: 'प्रमाणीकरण स्थिति' },
  'profile.verificationSubmitted': { en: 'Verification request submitted.', np: 'प्रमाणीकरण अनुरोध पेश गरियो।' },
  'profile.volunteerStatus': { en: 'Volunteer Status', np: 'स्वयंसेवक स्थिति' },
  'profile.wardNumber': { en: 'Ward Number', np: 'वडा नम्बर' },
  'profile.website': { en: 'Website', np: 'वेबसाइट' },
  'profile.whoCanComment': { en: 'Who can comment on my reports?', np: 'मेरो रिपोर्टमा कसले टिप्पणी गर्न सक्छ?' },
  'profile.whoCanFollow': { en: 'Who can follow me?', np: 'मलाई कसले अनुसरण गर्न सक्छ?' },
  'profile.whoCanMessage': { en: 'Who can message me?', np: 'मलाई कसले सन्देश पठाउन सक्छ?' },
  'profile.yourContributions': { en: 'Your contributions and community standing.', np: 'तपाईंको योगदान र सामुदायिक स्थान।' },
  'footer.about': { en: 'About', np: 'बारे' },
  'footer.contact': { en: 'Contact', np: 'सम्पर्क' },
  'footer.faq': { en: 'FAQ', np: 'प्रश्नोत्तर' },
  'footer.privacy': { en: 'Privacy Policy', np: 'गोपनीयता नीति' },
  'footer.terms': { en: 'Terms & Conditions', np: 'सर्तहरू' },
  'btn.startReport': { en: 'Start a Report Now', np: 'अहिलै रिपोर्ट सुरु गर्नुहोस्' },
  'btn.openMap': { en: 'Open Map', np: 'नक्सा खोल्नुहोस्' },
  'btn.moreQuestions': { en: 'More Questions', np: 'थप प्रश्नहरू' },
  'btn.viewAllNotices': { en: 'View All Notices', np: 'सबै सूचना हेर्नुहोस्' },

  /* ── Feed / Post ── */
  'feed.noReports': { en: 'No reports match this filter yet.', np: 'कुनै पनि रिपोर्ट फिल्टरसँग मेल खाएन।' },
  'feed.noComments': { en: 'No comments yet. Be the first to share your thoughts.', np: 'अहिलेसम्म कुनै टिप्पणी छैन। पहिलो टिप्पणी गर्नुहोस्।' },
  'feed.post': { en: 'Post', np: 'पोस्ट गर्नुहोस्' },
  'feed.addComment': { en: 'Write a comment...', np: 'टिप्पणी लेख्नुहोस्...' },

  /* ── Map / Filter ── */
  'map.badge': { en: 'Explore Map', np: 'नक्सा हेर्नुहोस्' },
  'map.description': { en: 'Browse civic issues across the Kathmandu Metropolitan City. Click on markers to see report details.', np: 'काठमाडौं महानगरपालिकाका समस्याहरू नक्सामा हेर्नुहोस्। विवरण हेर्न मार्करमा क्लिक गर्नुहोस्।' },
  'map.mapView': { en: 'Map View', np: 'नक्सा दृश्य' },
  'map.listView': { en: 'List View', np: 'सूची दृश्य' },
  'map.myLocation': { en: 'My Location', np: 'मेरो स्थान' },
  'map.wardBoundaries': { en: 'Ward Boundaries', np: 'वडा सीमाहरू' },
  'map.loading': { en: 'Loading map...', np: 'नक्सा लोड हुँदै...' },
  'filter.allCategories': { en: 'All Categories', np: 'सबै श्रेणीहरू' },
  'filter.allStatus': { en: 'All Status', np: 'सबै स्थिति' },
  'filter.allPriority': { en: 'All Priority', np: 'सबै प्राथमिकता' },
  'filter.allTime': { en: 'All Time', np: 'सबै समय' },
  'filter.pastWeek': { en: 'Past Week', np: 'पछिल्लो हप्ता' },
  'filter.pastMonth': { en: 'Past Month', np: 'पछिल्लो महिना' },
  'filter.past3Months': { en: 'Past 3 Months', np: 'पछिल्लो ३ महिना' },
  'filter.noResults': { en: 'No issues match your filters.', np: 'तपाईंको फिल्टरसँग मेल खाने कुनै समस्या छैन।' },

  /* ── Priority ── */
  'priority.urgent': { en: 'Urgent', np: 'अत्यावश्यक' },
  'priority.high': { en: 'High', np: 'उच्च' },
  'priority.medium': { en: 'Medium', np: 'मध्यम' },
  'priority.low': { en: 'Low', np: 'कम' },

  /* ── Auth extras ── */
  'auth.officialId': { en: 'Official ID', np: 'अधिकारी आईडी' },
  'auth.codeSent': { en: 'Code sent!', np: 'कोड पठाइयो!' },
  'auth.email': { en: 'Email', np: 'इमेल' },
  'auth.username': { en: 'Username', np: 'प्रयोगकर्ता नाम' },
  'auth.register': { en: 'Register', np: 'दर्ता गर्नुहोस्' },
  'auth.notRegistered': { en: 'Not registered? Sign Up', np: 'दर्ता गर्नुभएन? साइन अप गर्नुहोस्' },
  'auth.alreadyRegistered': { en: 'Already registered? Login', np: 'पहिल्यै दर्ता भइसकेको? लगइन गर्नुहोस्' },
  'auth.verifyPhone': { en: 'Verify Phone Number', np: 'फोन नम्बर प्रमाणित गर्नुहोस्' },
  'auth.enterCode': { en: 'Enter the 6-digit code sent to', np: 'पठाइएको ६-अङ्कको कोड प्रविष्ट गर्नुहोस्' },
  'auth.verify': { en: 'Verify', np: 'प्रमाणित गर्नुहोस्' },
  'auth.resendCode': { en: 'Resend Code', np: 'पुनः कोड पठाउनुहोस्' },
  'auth.changePhone': { en: 'Change Phone Number', np: 'फोन नम्बर परिवर्तन गर्नुहोस्' },
  'auth.fullName': { en: 'Full Name', np: 'पूरा नाम' },
  'common.loading': { en: 'Loading...', np: 'लोड हुँदै...' },
}

interface LangContextValue {
  lang: 'en' | 'np'
  t: (key: string) => string
  setLang: (lang: 'en' | 'np') => void
  toggleLang: () => void
}

const LangContext = createContext<LangContextValue | null>(null)

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LangProvider')
  return ctx
}

function applyTranslations(lang: 'en' | 'np') {
  if (typeof document === 'undefined') return
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n
    if (!key) return
    const entry = translations[key]
    const text = entry ? (entry[lang] || entry.en || key) : key
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      (el as HTMLInputElement | HTMLTextAreaElement).placeholder = text
    } else {
      el.innerHTML = text
    }
  })
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle
    if (!key) return
    const entry = translations[key]
    if (entry) el.title = entry[lang] || entry.en || key
  })
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria
    if (!key) return
    const entry = translations[key]
    if (entry) el.setAttribute('aria-label', entry[lang] || entry.en || key)
  })
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<'en' | 'np'>('en')

  useEffect(() => {
    const stored = localStorage.getItem(LNG_KEY) as 'en' | 'np' | null
    if (stored === 'en' || stored === 'np') {
      setLangState(stored)
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.lang = lang === 'np' ? 'ne' : 'en'
    applyTranslations(lang)
  })

  const setLang = useCallback((l: 'en' | 'np') => {
    localStorage.setItem(LNG_KEY, l)
    setLangState(l)
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: l } }))
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'en' ? 'np' : 'en')
  }, [lang, setLang])

  const t = useCallback((key: string): string => {
    const entry = translations[key]
    if (!entry) return key
    return entry[lang] || entry.en || key
  }, [lang])

  useEffect(() => {
    (window as any).__ = t
    ;(window as any).setLang = setLang
    ;(window as any).applyTranslations = () => applyTranslations(lang)
    ;(window as any).toggleLang = toggleLang
  }, [t, setLang, toggleLang, lang])

  return (
    <LangContext.Provider value={{ lang, t, setLang, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}
