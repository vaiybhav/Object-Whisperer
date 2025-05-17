# Object Whisperer

A web application that uses Google's Gemini API to detect and describe objects through your camera.

## Features

- Real-time object detection through your device camera
- Integration with Google's Gemini AI to generate descriptions about detected objects
- Simple and intuitive user interface

## Prerequisites

- Node.js (version 14 or higher)
- A Google Cloud account with Gemini API enabled
- Google Cloud service account with appropriate permissions

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/object-whisperer.git
   cd object-whisperer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory with your Gemini API key:
   ```
   GEMINI_API_KEYS=your-gemini-api-key
   ```

4. Place your Google Cloud service account JSON file in the root directory as `service-account.json`

5. Start the development server:
   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Grant camera permissions when prompted
2. Point your camera at an object you want to identify
3. The application will detect the object and display a bounding box around it
4. A description of the object will be generated using the Gemini AI model

## Project Structure

- `/src/app`: Contains the Next.js app router components and API routes
- `/src/components`: React components including camera interface and UI elements

## Technologies Used

- Next.js
- React
- Google Gemini API
- TensorFlow.js (for object detection)
- Tailwind CSS

## License

[MIT](LICENSE) 