USE cabgateway;

INSERT INTO purchase_order_items (
  centro,
  deposito,
  material_number,
  expected_quantity,
  criado_por,
  serial_range,
  item,
  status
) VALUES
  ('4300002838', 'D01', '6460001', 10, 'marlon.teixeira', 'SN001-SN010', 'ITEM001', 'pending'),
  ('4300002838', 'D01', '6460002', 5, 'marlon.teixeira', 'SN011-SN015', 'ITEM002', 'pending'),
  ('4300002839', 'D02', '6460003', 20, 'marlon.teixeira', 'SN100-SN119', 'ITEM001', 'pending')
ON DUPLICATE KEY UPDATE
  expected_quantity = VALUES(expected_quantity),
  criado_por = VALUES(criado_por),
  serial_range = VALUES(serial_range),
  status = 'pending',
  updated_at = CURRENT_TIMESTAMP;
