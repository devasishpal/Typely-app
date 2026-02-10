# TYPELY Typing Training Platform Requirements Document

## 1. Application Overview

### 1.1 Application Name
TYPELY

### 1.2 Application Description
TYPELY is a comprehensive and advanced typing training web platform inspired by Typing Master, designed to provide a professional, modern, and user-friendly typing learning experience for both beginners and advanced learners. The platform features structured lessons, interactive practice modes, real-time feedback, detailed analytics, and gamification elements to help users master typing efficiently and effectively.

## 2. Core Features

### 2.1 Authentication System
- User registration with email-based signup
- Social login integration (Google login via OSS Google login method)
- Secure login page
- Password recovery functionality
- Email/OTP verification (optional)
- User profile management
- Admin capability to clear all registered user details

### 2.2 Lesson Structure
- Home row typing lessons (ASDF JKL;)
- Top row lessons (QWERTY)
- Bottom row lessons (ZXCVBN)
- Number row training
- Numeric keypad lessons
- Special character practice
- Shift key usage training
- Punctuation practice
- Combination drills
- Clear finger placement guidance for each lesson
- Typing posture instructions
- Hand positioning tutorials
- Support both sequential progression (locked lessons) and free selection modes
- Automatic lesson switching upon completion
- Increased practice lines in each lesson for more comprehensive training
- Click to Start button for each lesson with text: Click to start this lesson → Start practice

### 2.3 Interactive Learning Features
- Real-time interactive on-screen keyboard
- Key highlighting showing next key to press
- Finger usage indication
- Instant error detection and highlighting
- Audio feedback for incorrect keys
- Visual alerts for typing errors

### 2.4 Training Modes
- Structured typing courses
- Customizable practice sessions
- Speed-building exercises
- Accuracy improvement drills
- Typing challenges

### 2.5 Typing Tests
- Timed typing tests
- Paragraph typing tests
- Word typing tests
- Random text tests
- User-generated custom text tests
- Typing test content must fit within the designated rectangle box without overflow
- Each typing test section contains a minimum of 5000 words per paragraph
- System includes 10 different paragraphs (each 5000 words) that rotate in a loop
- Each time a user opens the typing test page, a different paragraph from the pool is displayed

### 2.6 Statistics and Analytics
- Words Per Minute (WPM) tracking
- Characters Per Minute (CPM) tracking
- Accuracy percentage calculation
- Total keystrokes count
- Backspace usage monitoring
- Error count tracking
- Error key analysis
- Typing speed history
- Lesson completion status
- Progress charts and graphs
- Detailed analytics dashboard with daily progress, weekly improvement, performance graphs, and lesson-by-lesson reports
- Persistent data storage in database for cross-device access

### 2.7 Gamification Features
- Typing games
- Interactive challenges
- Motivational achievements
- Badges and rewards system
- Level progression
- Proper certificate generation upon achievement completion
- Milestone-based progress unlocking

### 2.8 User Experience Features
- Automatic real-time progress saving
- Resume training from last position
- Cross-device synchronization
- Light mode and dark mode support
- Smooth animations
- Modern typography
- Easy navigation menus
- Clean lesson selection panel
- Enhanced visual effects throughout the website
- Colorful and vibrant design elements to create an amazing visual experience

### 2.9 Admin Dashboard
- WordPress-style admin login interface
- Proper admin credentials system with secure authentication
- Dedicated admin accounts with separate login portal
- Admin dashboard access restricted and not visible to regular users
- Modern, professional SaaS analytics dashboard design
- Clean and responsive UI with professional color scheme (blue/white or dark mode)
- Admin capability to delete all registered user details to start fresh with admin as first user

#### 2.9.1 Page Layout
- Left sidebar navigation menu
- Top header bar
- Main dashboard content area

#### 2.9.2 Sidebar Menu Items
- Dashboard
- Users
- Typing Tests
- Courses / Lessons
- Performance Analytics
- Certificates
- Payments (if premium exists)
- Reports
- Settings
- Logout

#### 2.9.3 Top Header Bar
- Admin profile icon + name
- Notification bell
- Search bar to search users
- Dark/Light mode toggle

#### 2.9.4 Dashboard Overview Cards (Top Stats)
- Total Registered Users
- Active Users Today
- Total Typing Tests Taken
- Average Typing Speed (WPM)
- Average Accuracy %
- New Users This Week

#### 2.9.5 Users Management Table
Detailed user table with filters and actions containing the following columns:
1. Profile Picture
2. Full Name
3. Username
4. Email Address
5. Phone Number (optional)
6. Country / Location
7. Registration Date
8. Last Login
9. Account Status (Active / Suspended / Banned)
10. Subscription Type (Free / Premium)
11. Current Typing Level (Beginner / Intermediate / Advanced)
12. Highest WPM Achieved
13. Average WPM
14. Best Accuracy %
15. Total Tests Completed
16. Total Practice Time (hours)
17. Certificates Earned
18. Progress Percentage
19. Rank on Leaderboard
20. Actions (View / Edit / Suspend / Delete)

#### 2.9.6 User Profile Details Page
When admin clicks a user, show full analytics:
- Personal Details
- Contact Info
- Account Status
- Typing Performance Graph (WPM over time)
- Accuracy graph
- Test history table
- Mistake analysis (common wrong letters)
- Lesson progress
- Achievements / badges
- Payment history (if premium)
- Notes section (admin remarks)
- Reset password button
- Disable account button
- Delete account button

#### 2.9.7 Analytics Section
Charts for:
- WPM growth trend of all users
- Most common mistakes
- Most used lessons
- Top 10 fastest typists
- Daily active users graph

#### 2.9.8 Filters & Search
Admin can filter users by:
- Level
- Country
- WPM range
- Accuracy range
- Registration date
- Subscription type
- Active / inactive

#### 2.9.9 Extra Features
- Export users data to CSV
- Send announcement to all users
- Bulk suspend users
- Role management (Admin / Moderator)
- Activity logs
- Secure authentication
- Data tables with pagination
- Graphs and charts
- Professional UI components
- Realistic dummy data

## 3. Technical Requirements

### 3.1 Responsive Design
- Full responsiveness across all devices (desktop monitors, laptops, tablets, mobile phones)
- Adaptive layouts optimized for different screen sizes
- Smooth scaling and transitions
- Responsive admin dashboard UI

### 3.2 UI/UX Design
- Highly attractive and clean interface
- Interactive and premium look similar to modern educational platforms
- Professional and modern design aesthetic
- Intuitive user flow for beginners to start learning from scratch
- Step-by-step guided progression
- Vibrant color scheme to enhance visual appeal
- Engaging visual effects and animations
- Modern dashboard style for admin panel
- Real production SaaS admin panel appearance

### 3.3 Performance and Security
- Fast loading times
- Optimized performance
- Secure backend architecture
- Scalable system design
- Data security and privacy protection
- Secure admin authentication with proper credential management
- All admin dashboard components working properly

## 4. User Flow

### 4.1 New User Journey
1. User visits TYPELY website
2. User signs up via email or Google login
3. User completes email/OTP verification (if enabled)
4. User is guided through initial setup and introduction
5. User can choose between sequential lesson progression or free lesson selection
6. User clicks Click to start this lesson → Start practice button to begin lesson
7. User begins typing lessons with real-time feedback
8. Upon lesson completion, system automatically switches to next lesson
9. User completes lessons and earns achievements
10. User receives proper certificate upon achievement completion
11. User tracks progress through analytics dashboard

### 4.2 Returning User Journey
1. User logs in to TYPELY
2. System loads saved progress
3. User resumes training from last position or selects new lesson
4. User clicks Click to start this lesson → Start practice button to begin
5. User practices and improves typing skills
6. User views updated statistics and progress reports

### 4.3 Admin User Journey
1. Admin accesses dedicated admin login portal
2. Admin enters proper credentials (username and password)
3. Admin logs into WordPress-style dashboard
4. Admin views dashboard overview cards with key statistics
5. Admin manages users through detailed users management table
6. Admin can view individual user profile details with full analytics
7. Admin can filter and search users based on various criteria
8. Admin manages lessons, content, and monitors platform performance through sidebar menu
9. Admin can delete all registered user details to start fresh
10. Admin can export user data, send announcements, and perform bulk actions
11. Admin logs out securely

## 5. Key Objectives
- Provide a complete Typing Master-equivalent web experience
- Help users develop proper typing habits and technique
- Offer structured learning path from beginner to advanced level
- Maintain user engagement through gamification
- Deliver accurate and detailed performance analytics
- Ensure seamless cross-device learning experience
- Create a professional and modern educational platform
- Provide visually stunning and colorful interface
- Ensure smooth automatic lesson progression
- Deliver proper certification for user achievements
- Ensure typing test content displays properly within designated boundaries
- Provide diverse typing test content through paragraph rotation system
- Provide secure and user-friendly admin dashboard with proper credential management
- Enable comprehensive admin control over user data management including viewing detailed user analytics and deleting all registered user details
- Deliver a modern, professional SaaS-style admin panel with real production quality