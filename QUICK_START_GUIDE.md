# Surgery Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ installed
- PostgreSQL database running
- Prisma CLI installed

### Setup Steps

1. **Database Setup** (Already Done ✅)
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

2. **Start Backend**
   ```bash
   cd server
   npm run dev
   ```
   Backend runs on: `http://localhost:5000`

3. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs on: `http://localhost:3000`

---

## 📍 Navigation Guide

### Main Routes

| Feature | Route | Description |
|---------|-------|-------------|
| OT Dashboard | `/dashboard/operation-theaters` | Real-time OT monitoring |
| Equipment | `/dashboard/operation-theaters/equipment` | Equipment inventory |
| Surgery Schedule | `/dashboard/surgery/schedule` | Calendar view of surgeries |
| Surgery Details | `/dashboard/surgery/[id]` | Complete surgery lifecycle |
| Analytics | `/dashboard/surgery/analytics` | Reports and metrics |

---

## 🎯 Common Workflows

### Workflow 1: Schedule a New Surgery

1. Go to `/dashboard/surgery/schedule`
2. Click "Schedule Surgery" button
3. Fill in:
   - Patient information
   - Surgeon
   - Operation Theater
   - Date & Time
   - Surgery type
   - Priority level
4. System checks for conflicts automatically
5. Click "Schedule"

### Workflow 2: Complete Pre-Operative Checklist

1. Go to `/dashboard/surgery/[surgeryId]`
2. Click "Pre-Operative" tab
3. Complete checklist items:
   - Patient Preparation ✓
   - Lab & Investigations ✓
   - Medications ✓
   - Equipment & Supplies ✓
   - Anesthesia ✓
   - Final Checks ✓
   - WHO Safety Checklist ✓
4. Watch completion percentage increase
5. Click "Save Checklist"
6. Surgery status auto-updates to PRE_OP when complete

### Workflow 3: Document Intra-Operative Data

1. Go to `/dashboard/surgery/[surgeryId]`
2. Click "Intra-Operative" tab
3. Enter Timeline:
   - Patient In OT time
   - Anesthesia Start/End
   - Surgery Start/End
   - Patient Out OT time
4. Add Vital Signs (click "Add Vital Reading"):
   - Time
   - Heart Rate, BP, SpO2, Temp, RR
5. Fill in:
   - Anesthesia details
   - Fluids & blood management
   - Procedure documentation
   - Surgical counts
   - Team notes
6. Click "Save Record"

### Workflow 4: Post-Operative Care

1. Go to `/dashboard/surgery/[surgeryId]`
2. Click "Post-Operative" tab
3. Complete:
   - Transfer details
   - ABCD assessment
   - Pain score (use slider)
   - Output monitoring
   - Medications
   - Complications (if any)
   - Discharge planning
   - Follow-up scheduling
4. Click "Save Record"

### Workflow 5: Generate Billing

1. Go to `/dashboard/surgery/[surgeryId]`
2. Click "Billing" tab
3. Click "Auto Calculate" to generate items automatically
4. Review/edit items:
   - OT charges
   - Surgeon fees
   - Anesthesia fees
   - Team fees
   - Consumables
5. Add custom items if needed
6. Adjust:
   - Discount (% or ₹)
   - Tax rate
   - Insurance coverage
7. Review patient copay
8. Click "Save Billing"
9. Click "Generate Invoice" (PDF export)

### Workflow 6: Monitor OT Status

1. Go to `/dashboard/operation-theaters`
2. View real-time stats:
   - Total OTs
   - Today's surgeries
   - In progress
   - Utilization rate
3. Filter by status (All/Available/Occupied/etc.)
4. Click OT card to view details
5. Check equipment and maintenance schedules

### Workflow 7: Track Equipment

1. Go to `/dashboard/operation-theaters/equipment`
2. View statistics
3. Use search to find equipment
4. Filter by status
5. Toggle Grid/List view
6. Check maintenance alerts (⚠️ icons)
7. Click "Maintenance" to schedule service

### Workflow 8: View Analytics

1. Go to `/dashboard/surgery/analytics`
2. Select date range (Week/Month/Quarter/Year)
3. Review:
   - Overview metrics (surgeries, completion rate, duration, revenue)
   - OT utilization percentages
   - Surgery type distribution
   - Priority distribution
   - Clinical metrics (complication rates, etc.)
   - Financial performance
   - Monthly trends
4. Click "Export" for reports

---

## 🔑 Key Shortcuts

### Time Savers
- **Surgery Scheduler**: Click surgery card → instant details
- **Pre-Op Checklist**: Auto-saves every change
- **Billing**: "Auto Calculate" generates all standard items
- **Equipment**: Toggle Grid/List view for different perspectives
- **Analytics**: Change date range for different insights

### Color Codes

**Surgery Priority:**
- 🔴 Red = CRITICAL
- 🟠 Orange = HIGH
- 🟡 Yellow = MEDIUM
- 🟢 Green = LOW

**OT Status:**
- 🟢 Green = AVAILABLE
- 🔵 Blue = OCCUPIED
- 🟡 Yellow = RESERVED/CLEANING
- 🟠 Orange = UNDER_MAINTENANCE
- 🔴 Red = OUT_OF_SERVICE

**Equipment Status:**
- 🟢 Available
- 🔵 In Use
- 🟡 Under Maintenance
- 🔴 Out of Service

---

## 💡 Pro Tips

### Best Practices

1. **Schedule Surgeries Early**
   - System checks for conflicts automatically
   - Books OT 1 hour before surgery start time

2. **Complete Checklists in Order**
   - Pre-Op → Intra-Op → Post-Op
   - Each phase builds on the previous

3. **Use Auto-Calculate for Billing**
   - Saves time with intelligent defaults
   - Based on OT type, duration, priority, team size

4. **Check Equipment Maintenance**
   - Yellow warnings appear 30 days before due
   - Schedule proactively to avoid surgery delays

5. **Monitor OT Utilization**
   - Target 70-85% utilization
   - Green bars = healthy, yellow/red = needs attention

### Keyboard Tips
- **Tab**: Navigate between form fields
- **Enter**: Submit forms (in modals)
- **Esc**: Close modals (when implemented)

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Can't schedule surgery
- **Check**: OT availability for that time slot
- **Check**: Surgeon schedule conflicts
- **Solution**: Choose different time or OT

**Issue**: Pre-Op checklist won't complete
- **Check**: All required items marked (*)
- **Solution**: Look for red asterisk items

**Issue**: Billing seems incorrect
- **Solution**: Click "Auto Calculate" to regenerate
- **Solution**: Manually adjust items as needed

**Issue**: Equipment shows maintenance due
- **Action**: Schedule maintenance via "Maintenance" button
- **Note**: Equipment can still be used if status is "Available"

**Issue**: Page not loading
- **Check**: Backend server running (port 5000)
- **Check**: Frontend server running (port 3000)
- **Solution**: Restart both servers

---

## 📱 Mobile Access

All pages are fully responsive:
- **Phone**: Stack layout, simplified grids
- **Tablet**: 2-column layouts
- **Desktop**: Full multi-column layouts

---

## 🌙 Dark Mode

Toggle dark mode via the theme switcher (if integrated).
All pages support dark mode with proper contrast.

---

## 📊 Data Reference

### Surgery Status Flow
```
SCHEDULED → PRE_OP → IN_PROGRESS → POST_OP → COMPLETED
     ↓
 CANCELLED (anytime)
```

### OT Status Auto-Updates
- Surgery IN_PROGRESS → OT becomes OCCUPIED
- Surgery COMPLETED → OT becomes CLEANING
- Surgery CANCELLED → OT becomes AVAILABLE

### Billing Categories
1. OT Charges
2. Surgeon Fee
3. Anesthesia Fee
4. Assistant Surgeon Fee
5. Nursing Charges
6. Equipment Charges
7. Consumables
8. Implants
9. Medications
10. Lab Tests
11. Imaging
12. Recovery Room
13. ICU Charges
14. Miscellaneous

---

## 🔗 Quick Links

### Documentation
- [Full Module README](./SURGERY_MODULE_README.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

### Support
- Create GitHub issue for bugs
- Contact dev team for feature requests

---

## ✅ Quick Checklist for Testing

Before going live, test:
- [ ] Schedule a surgery
- [ ] Complete pre-op checklist
- [ ] Record intra-op data with vitals
- [ ] Document post-op care
- [ ] Generate billing
- [ ] View on mobile device
- [ ] Test dark mode
- [ ] Check OT dashboard updates
- [ ] Verify equipment tracking
- [ ] Review analytics accuracy

---

**Need Help?** Refer to SURGERY_MODULE_README.md for detailed documentation.

**Ready to Start?** Navigate to `/dashboard/operation-theaters` to begin! 🚀
