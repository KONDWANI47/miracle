-- Insert sample data into the miracle_ecd database

-- Insert sample registrations
INSERT INTO registrations (parent_name, email, phone, address, child_name, child_age, start_date, program, message, status, payment_status)
VALUES 
('John Doe', 'john.doe@example.com', '+265991234567', 'Area 25, Sector 1, Lilongwe', 'Jane Doe', 4, '2025-09-01', 'Early Childhood Care (0-5 years)', 'Looking forward to enrolling my daughter.', 'Paid', 'Completed'),
('Mary Smith', 'mary.smith@example.com', '+265992345678', 'Area 47, Lilongwe', 'James Smith', 6, '2025-09-01', 'Foundation Program (5-7 years)', 'My son is excited to join your program.', 'Pending', 'Pending'),
('Robert Johnson', 'robert.j@example.com', '+265993456789', 'Area 18, Lilongwe', 'Sarah Johnson', 8, '2025-09-01', 'Primary Preparation (7-12 years)', 'Sarah has been in another school before.', 'Payment Required', 'Pending'),
('Elizabeth Brown', 'elizabeth@example.com', '+265994567890', 'Area 10, Lilongwe', 'Michael Brown', 3, '2025-09-01', 'Early Childhood Care (0-5 years)', 'Michael is very active and loves to play.', 'Approved', 'Completed'),
('David Wilson', 'david@example.com', '+265995678901', 'Area 15, Lilongwe', 'Emma Wilson', 5, '2025-09-01', 'Early Childhood Care (0-5 years)', 'Emma is shy but very creative.', 'Completed', 'Completed'),
('Patricia Lee', 'patricia@example.com', '+265996789012', 'Area 43, Lilongwe', 'William Lee', 7, '2025-09-01', 'Foundation Program (5-7 years)', 'William has shown interest in mathematics.', 'Paid', 'Completed'),
('Thomas Clark', 'thomas@example.com', '+265997890123', 'Area 12, Lilongwe', 'Olivia Clark', 9, '2025-09-01', 'Primary Preparation (7-12 years)', 'Olivia loves reading books.', 'Pending', 'Pending'),
('Jennifer White', 'jennifer@example.com', '+265998901234', 'Area 49, Lilongwe', 'Alexander White', 4, '2025-09-01', 'Early Childhood Care (0-5 years)', 'Alexander is very social and friendly.', 'Rejected', 'Failed'),
('Charles Harris', 'charles@example.com', '+265999012345', 'Area 23, Lilongwe', 'Sophia Harris', 6, '2025-09-01', 'Foundation Program (5-7 years)', 'Sophia has been homeschooled until now.', 'Payment Required', 'Pending'),
('Margaret Young', 'margaret@example.com', '+265990123456', 'Area 36, Lilongwe', 'Benjamin Young', 10, '2025-09-01', 'Primary Preparation (7-12 years)', 'Benjamin is transferring from another school.', 'Approved', 'Completed');

-- Insert sample payments
INSERT INTO payments (registration_id, parent_name, amount, currency, payment_date, status, payment_method, stripe_payment_id)
VALUES 
(1, 'John Doe', 50.00, 'MWK', '2025-08-10 09:15:00', 'Completed', 'Mobile Money', 'TXN-2025-0001'),
(4, 'Elizabeth Brown', 50.00, 'MWK', '2025-08-11 14:30:00', 'Completed', 'Bank Transfer', 'TXN-2025-0002'),
(5, 'David Wilson', 50.00, 'MWK', '2025-08-12 11:45:00', 'Completed', 'Cash', 'TXN-2025-0003'),
(6, 'Patricia Lee', 50.00, 'MWK', '2025-08-13 16:20:00', 'Completed', 'Mobile Money', 'TXN-2025-0004'),
(10, 'Margaret Young', 50.00, 'MWK', '2025-08-14 10:05:00', 'Completed', 'Bank Transfer', 'TXN-2025-0005'),
(8, 'Jennifer White', 50.00, 'MWK', '2025-08-15 13:40:00', 'Failed', 'Card', 'TXN-2025-0006');