# spatial-team2

## Installation

Clone the Repository:  
   
bash  
   git clone <repository-url>  
   cd spatial-fe
   
Installing Dependencies:
Run the following command to install both frontend and development dependencies:
npm install

Setting Up Backend:
1. Ensure you have a .env.local file with the necessary environment variables configured in the backend directory (../FlaskMongoDB/).
2. Install backend dependencies:
pip install -r  requirements.txt

## Running the Application
### To start the application, you can use the following commands inside the spatial-fe folder:

### Run Both Frontend and Backend Concurrently
bash 
npm run startThis command starts both the React.js frontend and the Flask backend simultaneously.

### Run Frontend Only

bash 
npm run start:frontendStarts the React.js frontend only.

### Run Backend Only
bash 
npm run start:backendStarts the Flask backend from the ../FlaskMongoDB/ directory.
