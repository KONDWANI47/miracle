# 🔄 Cross-Device Registration Test Guide

## 🎯 Test Objective
Verify that you can register on one device and access the registration data from a different device.

## 📋 Prerequisites
1. **Server Running**: Make sure the server is running on port 8000
2. **Two Devices/Browsers**: You'll need access to two different devices or browsers
3. **File Transfer Method**: USB drive, email, cloud storage, or any method to transfer JSON files

## 🧪 Test Steps

### Step 1: Register on Device 1
1. **Open** `http://localhost:8000` on Device 1
2. **Fill out** the registration form with test data:
   - Parent/Guardian Name: `John Doe`
   - Email: `john.doe@example.com`
   - Phone: `+265992260985`
   - Child's Name: `Jane Doe`
   - Child's Age: `5`
   - Start Date: `Next week`
   - Program: `Foundation Program`
   - Message: `Test registration for cross-device access`
3. **Submit** the form
4. **Verify** you see the success message

### Step 2: Export Data from Device 1
1. **Open** browser console (F12)
2. **Run** the command: `exportRegistrations()`
3. **Download** the JSON file (it will be named `registrations-YYYY-MM-DD.json`)
4. **Save** this file to a location you can access from Device 2

### Step 3: Transfer Data to Device 2
1. **Transfer** the JSON file from Device 1 to Device 2 using:
   - USB drive
   - Email attachment
   - Cloud storage (Google Drive, Dropbox, etc.)
   - Any file sharing method

### Step 4: Import Data on Device 2
1. **Open** `http://localhost:8000` on Device 2
2. **Scroll down** to the "View Registrations" section
3. **Click** "Import Registrations" button
4. **Select** the JSON file you transferred from Device 1
5. **Click** "Import" to load the data

### Step 5: Verify Data on Device 2
1. **Click** "View Registrations" button
2. **Verify** that the registration from Device 1 appears in the list
3. **Check** that all details are correct:
   - Parent name: `John Doe`
   - Email: `john.doe@example.com`
   - Phone: `+265992260985`
   - Child name: `Jane Doe`
   - Program: `Foundation Program`

## 🔍 Alternative Verification Methods

### Method 1: Console Commands
On Device 2, open console (F12) and run:
```javascript
// View all registrations
viewRegistrations()

// Check raw data
JSON.parse(localStorage.getItem('registrations'))

// Export data to verify
exportRegistrations()
```

### Method 2: Automated Test Page
1. **Open** `http://localhost:8000/test-cross-device-workflow.html`
2. **Click** "Run Complete Test" to run automated tests
3. **Review** the test results

### Method 3: Data Access Test Page
1. **Open** `http://localhost:8000/test-cross-device-access.html`
2. **Use** the import/export buttons
3. **Verify** data appears correctly

## ✅ Success Criteria
- [ ] Registration saves successfully on Device 1
- [ ] Export creates a valid JSON file
- [ ] File transfers successfully to Device 2
- [ ] Import loads data correctly on Device 2
- [ ] All registration details are preserved
- [ ] Data is accessible via console commands
- [ ] Data appears in the registration modal

## 🚨 Troubleshooting

### Issue: Export doesn't work
**Solution**: Check browser console for errors. Make sure you have registrations saved first.

### Issue: Import doesn't work
**Solution**: 
1. Verify the JSON file is valid
2. Check browser console for errors
3. Try refreshing the page before importing

### Issue: Data doesn't appear after import
**Solution**:
1. Check if the import was successful (console should show success message)
2. Try clicking "View Registrations" again
3. Check console with `viewRegistrations()` command

### Issue: Server not accessible
**Solution**:
1. Make sure server is running: `python -m http.server 8000`
2. Check if port 8000 is available
3. Try a different port if needed

## 📱 Real-World Testing Scenarios

### Scenario 1: Phone to Computer
1. Register on your phone
2. Export data to email
3. Open email on computer
4. Download and import the file

### Scenario 2: Different Browsers
1. Register in Chrome
2. Export data
3. Import in Firefox or Edge

### Scenario 3: Different Computers
1. Register on work computer
2. Export to USB drive
3. Import on home computer

## 🎉 Expected Results
After completing the test, you should be able to:
- ✅ Register on any device
- ✅ Export registration data to a file
- ✅ Transfer that file to any other device
- ✅ Import and access the data on the new device
- ✅ View all registration details correctly
- ✅ Use console commands to manage data

## 📞 Support
If you encounter any issues during testing:
1. Check the browser console for error messages
2. Verify all steps were followed correctly
3. Try the automated test page for debugging
4. Ensure the server is running properly

---

**Happy Testing! 🚀** 