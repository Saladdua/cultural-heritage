export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">API Documentation</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-4">Backend Architecture</h2>
        <p className="mb-4">
          This application uses a Python Flask backend with a MySQL database for storing metadata about 3D cultural
          heritage artifacts. The frontend is built with Next.js and communicates with the backend via RESTful API
          endpoints.
        </p>

        <h3 className="text-lg font-medium mt-6 mb-3">Technology Stack</h3>
        <ul className="list-disc pl-5 space-y-1 mb-6">
          <li>
            <strong>Frontend:</strong> Next.js, React, Three.js
          </li>
          <li>
            <strong>Backend:</strong> Python, Flask
          </li>
          <li>
            <strong>Database:</strong> MySQL
          </li>
          <li>
            <strong>3D Visualization:</strong> Three.js, React Three Fiber
          </li>
        </ul>
      </div>

      <h2 className="text-2xl font-semibold mb-4">API Endpoints</h2>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">GET</span>
            <h3 className="ml-2 text-lg font-medium">Folders</h3>
          </div>
          <p className="mb-4">Retrieve all folders or a specific folder by ID.</p>

          <div className="space-y-2">
            <div className="bg-slate-50 p-3 rounded-md">
              <code className="text-sm">GET /api/folders</code>
              <p className="text-sm text-slate-600 mt-1">Returns a list of all folders.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-md">
              <code className="text-sm">GET /api/folders/:id</code>
              <p className="text-sm text-slate-600 mt-1">Returns a specific folder by ID.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">POST</span>
            <h3 className="ml-2 text-lg font-medium">Folders</h3>
          </div>
          <p className="mb-4">Create a new folder.</p>

          <div className="bg-slate-50 p-3 rounded-md">
            <code className="text-sm">POST /api/folders</code>
            <p className="text-sm text-slate-600 mt-1">Creates a new folder.</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Request Body:</p>
              <pre className="bg-slate-100 p-2 rounded-md mt-1 text-sm overflow-x-auto">
                {`{
  "name": "Folder Name"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">PUT</span>
            <h3 className="ml-2 text-lg font-medium">Folders</h3>
          </div>
          <p className="mb-4">Update an existing folder.</p>

          <div className="bg-slate-50 p-3 rounded-md">
            <code className="text-sm">PUT /api/folders/:id</code>
            <p className="text-sm text-slate-600 mt-1">Updates a folder by ID.</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Request Body:</p>
              <pre className="bg-slate-100 p-2 rounded-md mt-1 text-sm overflow-x-auto">
                {`{
  "name": "Updated Folder Name"
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium">DELETE</span>
            <h3 className="ml-2 text-lg font-medium">Folders</h3>
          </div>
          <p className="mb-4">Delete a folder.</p>

          <div className="bg-slate-50 p-3 rounded-md">
            <code className="text-sm">DELETE /api/folders/:id</code>
            <p className="text-sm text-slate-600 mt-1">Deletes a folder by ID and all its contents.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium">GET</span>
            <h3 className="ml-2 text-lg font-medium">Models</h3>
          </div>
          <p className="mb-4">Retrieve 3D models.</p>

          <div className="space-y-2">
            <div className="bg-slate-50 p-3 rounded-md">
              <code className="text-sm">GET /api/folders/:folderId/models</code>
              <p className="text-sm text-slate-600 mt-1">Returns all models in a specific folder.</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-md">
              <code className="text-sm">GET /api/models/:id</code>
              <p className="text-sm text-slate-600 mt-1">Returns a specific model by ID.</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">POST</span>
            <h3 className="ml-2 text-lg font-medium">Models</h3>
          </div>
          <p className="mb-4">Upload a new 3D model.</p>

          <div className="bg-slate-50 p-3 rounded-md">
            <code className="text-sm">POST /api/folders/:folderId/models</code>
            <p className="text-sm text-slate-600 mt-1">Uploads a new 3D model to a specific folder.</p>
            <div className="mt-2">
              <p className="text-sm font-medium">Request Body (multipart/form-data):</p>
              <pre className="bg-slate-100 p-2 rounded-md mt-1 text-sm overflow-x-auto">
                {`{
  "file": [Binary 3D model file (.obj, .ply, .stl)]
}`}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium">DELETE</span>
            <h3 className="ml-2 text-lg font-medium">Models</h3>
          </div>
          <p className="mb-4">Delete a 3D model.</p>

          <div className="bg-slate-50 p-3 rounded-md">
            <code className="text-sm">DELETE /api/models/:id</code>
            <p className="text-sm text-slate-600 mt-1">Deletes a 3D model by ID.</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mt-10 mb-4">Database Schema</h2>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">MySQL Tables</h3>

        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-2">folders</h4>
            <pre className="bg-slate-100 p-3 rounded-md text-sm overflow-x-auto">
              {`CREATE TABLE folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">models</h4>
            <pre className="bg-slate-100 p-3 rounded-md text-sm overflow-x-auto">
              {`CREATE TABLE models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(512) NOT NULL,
  file_type ENUM('obj', 'ply', 'stl') NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
