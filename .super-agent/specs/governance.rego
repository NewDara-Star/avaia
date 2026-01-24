
This **Open Policy Agent (Rego)** template enforces the "Bounding Box" strategy. It validates the architectural topology and tech stack against safety rules, preventing "Architectural Hallucination" and license contamination.

```rego
package main

import future.keywords.if
import future.keywords.in

# -----------------------------------------------------------------------------
# VIOLATION ACCUMULATOR
# -----------------------------------------------------------------------------
deny[msg] {
    violation := violations[_]
    msg := violation
}

# -----------------------------------------------------------------------------
# RULE 1: BOUNDARY ENFORCEMENT (Zero Trust)
# Constraint: Public-facing containers cannot directly touch 'Secrets' or 'PCI-DSS' databases.
# Source: specs/architecture.json
# -----------------------------------------------------------------------------
violations["Critical: Public container accessing High-Sensitivity Data directly"] if {
    # Find a relationship in the architecture
    rel := input.architecture.data_flow_graph[_]
    
    # Identify Source and Target containers
    source := [c | c := input.architecture.containers[_]; c.id == rel.source_container_id]
    target := [c | c := input.architecture.containers[_]; c.id == rel.target_container_id]
    
    # Check Logic: Source is External/Public -> Target is Sensitive
    source.location == "External"
    target.data_sensitivity in ["PCI-DSS", "Secrets", "PII"]
    
    # Exception: Unless routed through a secure API Gateway (Architectural Pattern)
    not source.type == "API Gateway"
}

# -----------------------------------------------------------------------------
# RULE 2: SUPPLY CHAIN LICENSE COMPLIANCE
# Constraint: No Viral Licenses (GPL/AGPL) allowed in the stack.
# Source: specs/stack.json
# -----------------------------------------------------------------------------
violations[sprintf("Compliance: Forbidden License '%v' found in library '%v'", [lib.license, lib.name])] if {
    lib := input.stack.libraries[_]
    forbidden_licenses := ["GPL", "AGPL", "GPLv3", "AGPLv3"]
    
    # Check if license matches forbidden list
    lib.license in forbidden_licenses
}

# -----------------------------------------------------------------------------
# RULE 3: DATA TRANSPORT SECURITY
# Constraint: All External communication must use HTTPS or SSH.
# -----------------------------------------------------------------------------
violations[sprintf("Security: Insecure protocol '%v' used for external connection", [rel.protocol])] if {
    rel := input.architecture.data_flow_graph[_]
    
    # If the target is external, protocol must be secure
    target := [c | c := input.architecture.containers[_]; c.id == rel.target_container_id]
    target.location == "External"
    
    not rel.protocol in ["HTTPS", "SSH", "SFTP", "WSS"]
}

# -----------------------------------------------------------------------------
# RULE 4: UNVERIFIED TOOLS (Slopsquatting Prevention)
# Constraint: All libraries must have a security_scan_status of "Clean"
# -----------------------------------------------------------------------------
violations[sprintf("Supply Chain: Library '%v' has not passed security scan", [lib.name])] if {
    lib := input.stack.libraries[_]
    lib.security_scan_status != "Clean"
}