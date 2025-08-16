# SnapRate - Review Businesses. Earn Money.

SnapRate is a platform that incentivizes users to rate businesses in exchange for rewards such as airtime, cash, or coupons. The platform encourages authentic user reviews and connects businesses with engaged customers.

## 🚀 Features

### Core Functionality

- **Multi-Role Authentication**: Reviewer, Business Owner, Agent, Admin, and Super Admin roles
- **Business Reviews**: Text, image, and video reviews with moderation system
- **Reward System**: Earn NGN 50 per valid review, NGN 100 per business recommendation
- **Referral System**: Earn NGN 20 per verified signup
- **Business Onboarding**: Agents can onboard businesses and earn NGN 1000 per verified business
- **Coupon Management**: Create and manage unique coupon codes with QR functionality
- **Dashboard Analytics**: Role-specific dashboards with insights and metrics

### Business Categories

- **Hospitality**: Hotels, Restaurants & Eateries
- **Transport**: Buses, Airlines & Logistics
- **Retail**: Shops, Malls & Markets
- **Healthcare**: Hospitals, Clinics & Pharmacies
- **Education**: Schools, Training Centers
- **Entertainment**: Cinemas, Event Centers

### Supported States

- Abuja, Lagos, Enugu, Anambra (Awka and Onitsha)
- PH, Ibadan, Imo (Owerri), Ebonyi (Abakaliki)

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL with proper indexing and relationships
- **Authentication**: NextAuth.js with Google OAuth and custom credentials
- **File Storage**: Cloudinary for media uploads (ready for integration)
- **UI Components**: Radix UI primitives with custom styling

### SOLID Principles Implementation

1. **Single Responsibility**: Each service handles one specific concern
2. **Open/Closed**: Services are extensible without modification
3. **Liskov Substitution**: Proper inheritance and interface implementation
4. **Interface Segregation**: Role-specific interfaces for different user types
5. **Dependency Inversion**: Dependencies injected through interfaces

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── agent/             # Agent dashboard
│   ├── business/          # Business dashboard
│   ├── reviewer/          # Reviewer dashboard
│   └── dashboard/         # General dashboard
├── components/            # Reusable UI components
│   └── ui/               # Base UI components
├── lib/                  # Utilities and configurations
├── services/             # Business logic services
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth credentials (for Google sign-in)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd snaprate
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/snaprate"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# SMS Service (for phone verification)
SMS_API_KEY="your-sms-api-key"
SMS_API_SECRET="your-sms-api-secret"

# Email Service
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-email-password"

# Cloudinary (for media uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create and apply database migrations
npx prisma db push

# (Optional) View database in Prisma Studio
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🔐 Authentication

### User Roles & Permissions

#### Reviewer

- Submit reviews (text, image, video)
- Earn NGN 50 per valid review
- Recommend businesses (earn NGN 100 per approved business)
- Invite friends via referral link/code (earn NGN 20 per verified signup)
- View and redeem rewards

#### Business Owner

- Register and verify business
- Create business profile and upload logo/info
- Offer coupons (used as user rewards)
- Create campaigns/promotions
- View insights: visits, reviews, active/redeemed coupons

#### Agent

- Apply to become an agent
- Onboard businesses using the form
- Earn NGN 1000 per verified business onboarded
- Add bank account for payouts
- Track commissions and performance

#### Admin

- Manage Reviewer, Business, and Agent accounts
- Approve businesses and agent applications
- Track platform metrics and review history
- Cannot edit or manage Admin/Super Admin accounts

#### Super Admin

- Full access to the platform, users, and configurations
- Add/edit Admins

## 📊 Database Schema

### Key Models

- **User**: Base user model with role-based access
- **Business**: Business profiles with verification status
- **Review**: User reviews with moderation system
- **Reward**: Reward tracking and redemption
- **Coupon**: Business coupon management
- **AgentProfile**: Agent-specific data and earnings
- **AdminAction**: Audit trail for admin actions

### Relationships

- Users can have multiple reviews and rewards
- Businesses belong to owners and can have multiple reviews
- Reviews are linked to users and businesses
- Rewards are linked to users and can be linked to reviews
- Agents can onboard multiple businesses

## 🚀 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow SOLID principles in service design
- Use proper error handling and validation
- Implement proper logging and monitoring

### API Design

- RESTful API endpoints
- Proper HTTP status codes
- Input validation and sanitization
- Rate limiting (to be implemented)

### Security

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control
- Input validation and sanitization

## 🔄 API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/session` - Get current session

### Users

- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user

### Businesses

- `POST /api/businesses` - Create business
- `GET /api/businesses` - List businesses with filters
- `GET /api/businesses/:id` - Get business details
- `PUT /api/businesses/:id` - Update business

### Reviews

- `POST /api/reviews` - Create review
- `GET /api/reviews` - List reviews with filters
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Rewards

- `GET /api/rewards` - Get user rewards
- `POST /api/rewards/:id/redeem` - Redeem reward

## 🎨 UI Components

### Component Library

- **Button**: Multiple variants and sizes
- **Card**: Content containers with headers and footers
- **Input**: Form inputs with validation states
- **Alert**: Success, error, and info notifications
- **Badge**: Status indicators and labels

### Styling

- Tailwind CSS for utility-first styling
- Custom design system with consistent spacing and colors
- Responsive design for mobile-first approach
- Dark mode support (to be implemented)

## 🚧 Roadmap

### Phase 1: Core Platform ✅

- [x] User authentication and role management
- [x] Business registration and verification
- [x] Review system with moderation
- [x] Basic reward system

### Phase 2: Enhanced Features

- [ ] Media upload (images/videos)
- [ ] QR code generation for coupons
- [ ] SMS verification system
- [ ] Email notification system

### Phase 3: Advanced Features

- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] API rate limiting and caching

### Phase 4: Scale & Optimize

- [ ] Performance optimization
- [ ] Advanced search and filtering
- [ ] Machine learning for review quality
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Email: support@snaprate.com
- Documentation: [docs.snaprate.com](https://docs.snaprate.com)
- Issues: [GitHub Issues](https://github.com/snaprate/snaprate/issues)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Tailwind CSS team for the utility-first CSS framework
- All contributors and supporters of the project

---

**SnapRate** - Empowering authentic business reviews and rewarding honest feedback. 🚀
