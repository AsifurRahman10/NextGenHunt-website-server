# NextGenTech Backend

**Live Site**: [NextGen Hunt](https://spectacular-praline-76df24.netlify.app/)  
**Server Side**: [NextGen Hunt Server](https://nextgenhunt-server.vercel.app/)
**Front-end repo link**: [NextGen Hunt frontend repo](https://github.com/AsifurRahman10/NextGenHunt-website)

This is the backend repository for the NextGenTech platform. It provides APIs for managing products, users, reviews, payments, blogs, and more. Built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization (JWT)
- Product management (CRUD operations)
- Review and comment system
- Payment integration (Stripe)
- Blog management
- Coupon and discount management
- Role-based access control (Admin, Moderator, User)
- Email notifications for payments
- Advanced search, sorting, and pagination for products
- Reporting and moderation features

## Technologies Used

- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Authentication:** JWT (JSON Web Tokens)
- **Payment Integration:** Stripe
- **Email Service:** Nodemailer (Gmail SMTP)
- **Environment Management:** Dotenv

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas or local MongoDB instance
- Stripe account (for payment integration)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/nextgen-tech-backend.git
   cd nextgen-tech-backend
   Install dependencies:
   ```

bash
Copy
npm install
Set up environment variables:
Create a .env file in the root directory and add the following variables:

env
Copy
USERID=your_mongodb_username
PASSWORD=your_mongodb_password
MAILER_EMAIL=your_email@gmail.com
MAILER_PASSWORD=your_email_password
ACCESS_TOKEN=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
Run the server:

bash
Copy
npm start
The server will start on http://localhost:3000.

API Documentation
For detailed API documentation, refer to the API Endpoints section below.

API Endpoints
Authentication
Generate JWT Token

POST /jwt

Description: Generates a JWT token for authenticated users.

Products
Get All Products

GET /all-products

Description: Retrieves all products with optional search, pagination, and sorting.

Add Product

POST /add-products

Description: Adds a new product to the database.

Get Product Details

GET /product-details/:id

Description: Retrieves details of a specific product by ID.

Users
Get User Info

GET /user-info/:email

Description: Retrieves user information by email.

Update User Info

PATCH /update-user/:id

Description: Updates user information (e.g., phone number, address).

Payments
Create Payment Intent

POST /create-payment-intent

Description: Creates a payment intent for Stripe integration.

Save Payment Info

POST /paymentInfo

Description: Saves payment information to the database.

Blogs
Add Blog

POST /add-blog

Description: Adds a new blog post.

Get Blogs

GET /blogs

Description: Retrieves all blog posts.

Coupons
Add Coupon

POST /add-coupon

Description: Adds a new coupon to the database.

Get All Coupons

GET /all-coupons

Description: Retrieves all available coupons.

Reviews
Post Review

POST /post-review

Description: Adds a review for a product.

Get All Reviews

GET /all-review/:id

Description: Retrieves all reviews for a specific product.

Reports
Report a Product

PATCH /report/:id

Description: Reports a product for moderation.

Statistics
Get Statistics

GET /statistics

Description: Retrieves platform statistics (e.g., total revenue, users, products).

Environment Variables
The following environment variables are required to run the project:

USERID: MongoDB username

PASSWORD: MongoDB password

MAILER_EMAIL: Email address for sending notifications

MAILER_PASSWORD: Email account password

ACCESS_TOKEN: Secret key for JWT authentication

STRIPE_SECRET_KEY: Stripe API secret key

Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.

Create a new branch (git checkout -b feature/YourFeatureName).

Commit your changes (git commit -m 'Add some feature').

Push to the branch (git push origin feature/YourFeatureName).

Open a pull request.

License
This project is licensed under the MIT License. See the LICENSE file for details.

Developed with ❤️ by Your Name.

Copy

### Key Sections:

1. **Features**: Highlights the main functionalities of your backend.
2. **Technologies Used**: Lists the tech stack.
3. **Getting Started**: Provides setup instructions.
4. **API Endpoints**: Summarizes the available APIs.
5. **Environment Variables**: Lists required environment variables.
6. **Contributing**: Guidelines for contributing to the project.
7. **License**: Specifies the project's license.

You can customize this template further to suit your project's specific needs.
