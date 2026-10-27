import io
import unittest
import zipfile
from scan_credentials import findings_text, findings_workbook


def workbook(cells):
    payload = io.BytesIO()
    with zipfile.ZipFile(payload, "w") as archive:
        archive.writestr(
            "xl/worksheets/sheet1.xml",
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>'
            + cells + '</sheetData></worksheet>',
        )
    payload.seek(0)
    return payload


class ScannerTests(unittest.TestCase):
    def test_url_redacted(self):
        value = 'postgresql://' + 'fixture:fixture@localhost/db'
        report = findings_text(value)
        self.assertEqual(report[0]['kind'], 'credential-in-url')
        self.assertNotIn('fixture', str(report))

    def test_env_reference(self):
        key = 'POSTGRES' + '_PASSWORD'
        self.assertEqual(findings_text(key + ': ${DB_SECRET:?required}'), [])

    def test_literal_assignment(self):
        key = 'POSTGRES' + '_PASSWORD'
        self.assertTrue(findings_text(key + ': fixture'))

    def test_blank(self):
        key = 'PASS' + 'WORD'
        self.assertEqual(findings_text(key + '=\"\"\nDATABASE_URL='), [])

    def test_sql(self):
        self.assertTrue(findings_text("crypt(" + "'fixture', gen_salt('bf'))"))

    def test_workbook(self):
        payload = workbook(
            '<row r="1"><c r="A1" t="inlineStr"><is><t>password</t></is></c></row>'
            '<row r="2"><c r="A2" t="inlineStr"><is><t>fixture</t></is></c></row>'
        )
        report = findings_workbook(payload)
        self.assertEqual(report[0]['location'], 'xl/worksheets/sheet1.xml:A2')
        self.assertNotIn('fixture', str(report))

    def test_business_workbook(self):
        payload = workbook(
            '<row r="1"><c r="A1" t="inlineStr"><is><t>KPI_ID</t></is></c></row>'
            '<row r="2"><c r="A2" t="inlineStr"><is><t>AV2</t></is></c></row>'
        )
        self.assertEqual(findings_workbook(payload), [])


if __name__ == '__main__':
    unittest.main()
