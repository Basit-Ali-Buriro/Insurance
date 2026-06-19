# Business & Second-Year Premium Feature Requirements

## Overview

Implement a Business (First-Year Premium) and Second-Year Premium
tracking system for insurance policies. The system must calculate values
at the policy level and automatically aggregate them through the
organizational hierarchy.

# Hierarchy Structure

Area Manager (AM) → Senior Sales Manager (SSM) → Sales Manager (SM) →
Sales Representative (SR) → Policies

Each policy belongs directly to an SR.

Policy business and premiums roll up: Policy → SR → SM → SSM → Area
Manager

# Database Fields

## Issue Date

Policy start date.

## Due Date

Annual premium due date.

## Last Paid Date

Most recent payment date.

## Premium Amount

Annual premium value.

# Total Business Logic

Business is counted only once at policy issuance (first premium).

Total Business = sum of all policy premiums.

# Second-Year Premium Logic

Only the second installment is counted.

Second Premium Due Date = Due Date + 1 Year

If Last Paid Date \>= Second Premium Due Date → count premium.

Otherwise ignore.

Third year and onward are NOT included.

# Hierarchical Aggregation

All values roll up:

SR → SM → SSM → Area Manager

# Final Output

System must calculate: - Total Business - Second-Year Premium

at all hierarchy levels.
