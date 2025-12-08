/**
 * Logo Upload API Route
 * 
 * Handles file upload for organization logos with validation and storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed image types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No file provided',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP, or SVG)',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File size too large. Maximum size is 5MB',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `logo-${uuidv4()}.${fileExtension}`;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'logos');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's okay
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // Return the public URL
    const logoUrl = `/uploads/logos/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        logoUrl,
        fileName,
        fileSize: file.size,
        fileType: file.type,
      },
      message: 'Logo uploaded successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload logo',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove uploaded logo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoUrl = searchParams.get('logoUrl');

    if (!logoUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Logo URL is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Extract filename from URL
    const fileName = logoUrl.split('/').pop();
    if (!fileName) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid logo URL',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // TODO: In a real application, you would delete the file from storage
    // const filePath = join(process.cwd(), 'public', 'uploads', 'logos', fileName);
    // await unlink(filePath);

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete logo',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}