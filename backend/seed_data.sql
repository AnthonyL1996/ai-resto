-- Chinese Takeaway Restaurant Sample Data for Belgium
-- Clean existing data
DELETE FROM reservations;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM menu_items;

-- Insert Menu Items
INSERT INTO menu_items (id, name, description, price, category, prep_time, is_available) VALUES
-- Rijst Gerechten (Rice Dishes)
('menu_001', 'Rijst Kantonees', 'Gebakken rijst met ei, ham, garnalen en groenten', 8.50, 'Rijst', 12, true),
('menu_002', 'Rijst Speciaal', 'Gebakken rijst met kip, rundvlees, garnalen en groenten', 9.80, 'Rijst', 15, true),
('menu_003', 'Rijst Kip', 'Gebakken rijst met kip en Chinese groenten', 8.20, 'Rijst', 12, true),
('menu_004', 'Rijst Rundvlees', 'Gebakken rijst met rundvlees en groenten', 8.50, 'Rijst', 12, true),
('menu_005', 'Rijst Garnalen', 'Gebakken rijst met garnalen en lente-ui', 9.20, 'Rijst', 10, true),

-- Bami Gerechten (Noodle Dishes)
('menu_006', 'Bami Kantonees', 'Gebakken noedels met ei, ham, garnalen en groenten', 8.80, 'Bami', 15, true),
('menu_007', 'Bami Speciaal', 'Gebakken noedels met kip, rundvlees, garnalen en groenten', 10.50, 'Bami', 18, true),
('menu_008', 'Bami Kip', 'Gebakken noedels met kip en Chinese groenten', 8.50, 'Bami', 15, true),
('menu_009', 'Bami Vegetarisch', 'Gebakken noedels met verse groenten en sojascheuten', 7.80, 'Bami', 12, true),

-- Vlees Gerechten (Meat Dishes)
('menu_010', 'Kip Cashewnoten', 'Gebakken kip met cashewnoten en groenten', 11.50, 'Vlees', 20, true),
('menu_011', 'Kip Zoetzuur', 'Gefrituerde kip met zoetzure saus', 10.80, 'Vlees', 18, true),
('menu_012', 'Rundvlees Oestersaus', 'Gebakken rundvlees met oestersaus en groenten', 12.50, 'Vlees', 22, true),
('menu_013', 'Varkensvlees Zoetzuur', 'Gefrituurd varkensvlees met zoetzure saus', 11.20, 'Vlees', 18, true),
('menu_014', 'Kip Kung Pao', 'Pittige kip met pinda''s en pepers', 11.80, 'Vlees', 20, true),

-- Garnalen & Vis
('menu_015', 'Garnalen Zoetzuur', 'Gefrituerde garnalen met zoetzure saus', 13.50, 'Garnalen', 15, true),
('menu_016', 'Garnalen Knoflook', 'Gebakken garnalen met knoflook en gember', 14.20, 'Garnalen', 12, true),
('menu_017', 'Vis Zoetzuur', 'Gefrituerde vis met zoetzure saus', 12.80, 'Vis', 18, true),

-- Soepen
('menu_018', 'Tomatensoep', 'Chinese tomatensoep met ei', 3.80, 'Soep', 8, true),
('menu_019', 'Champignonsoep', 'Soep met champignons en bamboe', 4.20, 'Soep', 10, true),
('menu_020', 'Wonton Soep', 'Traditionele Chinese soep met wontons', 5.50, 'Soep', 15, true),

-- Voorgerechten
('menu_021', 'Loempia''s (4 stuks)', 'Krokante loempia''s met groenten', 4.80, 'Voorgerecht', 8, true),
('menu_022', 'Kippenvleugels (6 stuks)', 'Gebakken kippenvleugels met Chinese kruiden', 6.50, 'Voorgerecht', 15, true),
('menu_023', 'Wan Tan (6 stuks)', 'Gefrituerde wan tan met vlees vulling', 5.20, 'Voorgerecht', 10, true),
('menu_024', 'Sateh (4 stokjes)', 'Gegrilde sateh met pindasaus', 7.20, 'Voorgerecht', 12, true),

-- Desserts
('menu_025', 'Gebakken IJs', 'Warm gebakken ijs met honing', 4.50, 'Dessert', 5, true),
('menu_026', 'Lychee', 'Verse lychee vruchten', 3.20, 'Dessert', 2, true),

-- Dranken
('menu_027', 'Chinese Thee', 'Traditionele Chinese thee', 2.50, 'Drank', 3, true),
('menu_028', 'Coca Cola', '33cl blikje', 2.20, 'Drank', 1, true),
('menu_029', 'Fanta', '33cl blikje', 2.20, 'Drank', 1, true);

-- Insert Customers (Belgian names)
INSERT INTO customers (id, email, phone, first_name, last_name, is_verified, created_at) VALUES
('cust_001', 'jan.janssen@telenet.be', '+32 9 123 4567', 'Jan', 'Janssen', true, NOW() - INTERVAL '30 days'),
('cust_002', 'marie.dupont@skynet.be', '+32 2 987 6543', 'Marie', 'Dupont', true, NOW() - INTERVAL '45 days'),
('cust_003', 'pieter.vdb@proximus.be', '+32 3 456 7890', 'Pieter', 'Van Der Berg', true, NOW() - INTERVAL '15 days'),
('cust_004', 'sophie.martin@gmail.com', '+32 4 321 9876', 'Sophie', 'Martin', true, NOW() - INTERVAL '60 days'),
('cust_005', 'luc.vermeersch@hotmail.com', '+32 9 555 1234', 'Luc', 'Vermeersch', true, NOW() - INTERVAL '20 days'),
('cust_006', 'emma.desmet@orange.be', '+32 2 777 8888', 'Emma', 'De Smet', true, NOW() - INTERVAL '90 days'),
('cust_007', 'thomas.willems@telenet.be', '+32 3 999 0000', 'Thomas', 'Willems', true, NOW() - INTERVAL '5 days'),
('cust_008', 'laura.vh@skynet.be', '+32 4 111 2222', 'Laura', 'Van Houten', true, NOW() - INTERVAL '75 days'),
('cust_009', 'kevin.peeters@gmail.com', '+32 9 333 4444', 'Kevin', 'Peeters', true, NOW() - INTERVAL '35 days'),
('cust_010', 'sarah.claes@proximus.be', '+32 2 555 6666', 'Sarah', 'Claes', true, NOW() - INTERVAL '10 days');

-- Insert Sample Orders
INSERT INTO orders (id, customer_id, customer_name, phone, items, payment_method, source, status, notes, created_at, time_slot) VALUES
('order_001', 'cust_001', 'Jan Janssen', '+32 9 123 4567', 
 '[{"item_id": "Rijst Kantonees", "quantity": 2, "special_requests": "Extra pikant"}, {"item_id": "Loempia''s (4 stuks)", "quantity": 1, "special_requests": null}]', 
 'card', 'website', 'completed', 'Bel aan bij aankomst', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '30 minutes'),
 
('order_002', 'cust_002', 'Marie Dupont', '+32 2 987 6543', 
 '[{"item_id": "Bami Speciaal", "quantity": 1, "special_requests": "Geen ui"}, {"item_id": "Kip Zoetzuur", "quantity": 1, "special_requests": null}]', 
 'cash', 'kiosk', 'ready', null, NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '15 minutes'),
 
('order_003', 'cust_003', 'Pieter Van Der Berg', '+32 3 456 7890', 
 '[{"item_id": "Garnalen Knoflook", "quantity": 1, "special_requests": null}, {"item_id": "Rijst Speciaal", "quantity": 1, "special_requests": "Extra groenten"}]', 
 'card', 'website', 'preparing', 'Allergisch voor noten', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '20 minutes'),
 
('order_004', 'cust_004', 'Sophie Martin', '+32 4 321 9876', 
 '[{"item_id": "Kip Cashewnoten", "quantity": 1, "special_requests": null}, {"item_id": "Chinese Thee", "quantity": 2, "special_requests": null}]', 
 'card', 'manual', 'new', 'Extra servetten graag', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '40 minutes'),
 
('order_005', 'cust_005', 'Luc Vermeersch', '+32 9 555 1234', 
 '[{"item_id": "Bami Vegetarisch", "quantity": 2, "special_requests": "Weinig zout"}, {"item_id": "Wonton Soep", "quantity": 1, "special_requests": null}]', 
 'cash', 'kiosk', 'preparing', null, NOW() - INTERVAL '25 minutes', NOW() + INTERVAL '35 minutes');

-- Insert Sample Reservations (using correct enum values)
INSERT INTO reservations (id, customer_id, phone, pickup_time, status, created_at, order_id, source) VALUES
('res_001', 'cust_002', '+32 2 987 6543', NOW() + INTERVAL '15 minutes', 'ready', NOW() - INTERVAL '45 minutes', 'order_002', 'kiosk'),
('res_002', 'cust_003', '+32 3 456 7890', NOW() + INTERVAL '20 minutes', 'confirmed', NOW() - INTERVAL '30 minutes', 'order_003', 'website'),
('res_003', 'cust_004', '+32 4 321 9876', NOW() + INTERVAL '40 minutes', 'pending', NOW() - INTERVAL '10 minutes', 'order_004', 'manual'),
('res_004', 'cust_005', '+32 9 555 1234', NOW() + INTERVAL '35 minutes', 'confirmed', NOW() - INTERVAL '25 minutes', 'order_005', 'kiosk');

-- Commit the transaction
COMMIT;