# MERN Stack CV Generator

A full-stack application for creating and managing CVs/resumes.

## Structure

- `Backend/`: Express.js backend with MongoDB connection
- `client/`: React.js frontend

## Environment Variables

This repository includes `.env` files for both frontend and backend to simplify deployment to AWS EC2.

### Backend Environment Variables

- `MONGO_URI`: MongoDB connection string
- `AWS_ACCESS_KEY_ID`: AWS access key (replace with your actual key)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (replace with your actual key)
- `AWS_REGION`: AWS region
- `AWS_S3_BUCKET_NAME`: S3 bucket name for file storage
- `BASE_URL`: Backend API URL

### Frontend Environment Variables

- `REACT_APP_API_URL`: Backend API URL

## Deployment

This project is configured to be deployed on AWS EC2.

## Note

In a production environment, it's generally not recommended to include `.env` files in your repository. This repository includes them for simplicity in deployment.
