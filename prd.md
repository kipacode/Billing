# RTRW-NET Billing & Invoice Management System - PRD

This document outlines the core concepts, flows, and features for an Internet Service Provider (ISP) Billing and Invoice Management Web Application.

---

## 1. App Flow

### 1.1 Admin / System Operator Flow
1. **Configuration**: Admin logs in and defines:
- **Service Plans** (Basic 5Mbps 120k/month, Standard 8Mbps 150k/month, Premium 10Mbps 200k/month).
- **Currency**: Currency autoset to Indonesian Rupiah (IDR).
2. **Customer Onboarding**: 
   - **Customer Onboarding**: Admin adds a new customer along with their installation address, server(between 1-8), whatsapp contact, and assigns an active Service Plan, and active or suspend the customer also date of registration.
3. **Automated Billing Engine**: 
   - **auto-generates invoices** for all active subscriptions. The invoice due date is 20th of the month.
4. **Reminders**: System automatically sends the generated invoices to customers via WhatsApp, and admin can also send the invoice to customers via WhatsApp manually.
5. **Payment Reconciliation**: 
   - **Manual Payments**: Admin receives cash/bank transfer and manually enters the payment to mark the invoice as "Paid".
6. **Revenue Recognition**: 
   - **Revenue Recognition**: The system automatically recognizes revenue based on the invoice status and payment status.
   - **Operational Expenses**: admin define and recognizes operational cost expenses manually. And it will be subtracted from the revenue to get the profit. 

7. **Reports**: 
   - **Profit Reports**: The system automatically generates profit reports based on the invoice status and payment status minus operational expenses.

---

## 2. Core Features

### 2.1 Customer Management (CRM)
- **Profiles**: Track customer name, installation address, server(between 1-8), whatsapp number, choose service plan, registration date.
- **Status Tracking**: Keep track of the user lifecycle (Active or Suspended).
- **Discounts**: Admin can define discounts for customers.

### 2.2 Product & Service Management
- **Plans & Packages**: Tiered internet packages (Basic 5Mbps 120k/month, Standard 8Mbps 150k/month, Premium 10Mbps 200k/month).

### 2.3 Invoicing & Billing
- **Recurring Invoices**: Cron-job-based automated invoice generation.
- **Invoice Receipt**: Template based invoice receipt to be sent to customers via WhatsApp.


### 2.4 Payment & Gateway Integration
- **Offline Ledger**: Interface for admins to record cash/cheque payments.

### 2.5 Dashboard & Reporting
- **Financial Metrics**: View MRR (Monthly Recurring Revenue) filtered by month and year.
- **Receivables Tracker**: Highlight total outstanding unpaid invoices and overdue customer lists filtered by month and year. 
- **Data Export**: Export tables to CSV/Excel for external accounting software.

### 2.6 Automations & API Integrations
- **Communication Workflows**: Automated whatsapp messages (reminders for overdue payments) and payment success confirmations.

