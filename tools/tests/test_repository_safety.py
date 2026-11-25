import unittest
from tools.check_repository_safety import path_findings, content_findings


class RepositorySafetyTests(unittest.TestCase):
    def test_deployment_workflow_is_rejected(self):
        self.assertIn("unapproved workflow", path_findings(".github/workflows/deploy.yml"))
        self.assertEqual(path_findings(".github/workflows/ci.yml"), [])

    def test_private_paths_are_rejected(self):
        for name in (".env", "site/.env.production", "pipeline/data/atlas.db", "site/public/data/jobs.json", "server.key"):
            with self.subTest(name=name):
                self.assertTrue(path_findings(name))
        self.assertEqual(path_findings(".env.example"), [])

    def test_secret_patterns_without_real_secrets(self):
        for label, value in [
            ("private key", b"-----BEGIN " + b"PRIVATE KEY-----"),
            ("GitHub token", b"ghp_" + b"x" * 36),
            ("AWS access key ID", b"AKIA" + b"X" * 16),
            ("OpenAI-style token", b"sk-" + b"x" * 40),
        ]:
            with self.subTest(label=label):
                self.assertIn(label, content_findings(value))

    def test_normal_text_and_binary(self):
        self.assertEqual(content_findings(b"Use secrets from the environment."), [])
        self.assertEqual(content_findings(b"\x00\x01\x02"), [])


if __name__ == "__main__":
    unittest.main()
