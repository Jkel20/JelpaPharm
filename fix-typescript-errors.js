const fs = require('fs');
const path = require('path');

// Function to fix Promise<void> return types in route files
function fixPromiseVoidReturns(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace Promise<void> return types with no return type
    const regex = /asyncHandler\(async \(req: AuthRequest, res: Response\): Promise<void> =>/g;
    const replacement = 'asyncHandler(async (req: AuthRequest, res: Response) =>';
    
    if (content.match(regex)) {
      content = content.replace(regex, replacement);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to recursively find and fix all route files
function fixAllRouteFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixAllRouteFiles(filePath);
    } else if (file.endsWith('.ts') && file.includes('route')) {
      fixPromiseVoidReturns(filePath);
    }
  });
}

// Fix all route files in the server/src/routes directory
const routesDir = path.join(__dirname, 'server', 'src', 'routes');
if (fs.existsSync(routesDir)) {
  console.log('Fixing Promise<void> return types in route files...');
  fixAllRouteFiles(routesDir);
  console.log('Done!');
} else {
  console.log('Routes directory not found');
}
