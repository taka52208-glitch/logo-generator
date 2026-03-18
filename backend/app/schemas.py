from pydantic import BaseModel, Field


class Analysis(BaseModel):
    company_name: str = Field(alias="companyName", default="")
    industry: str
    concept: str
    colors: list[str]
    mood: str
    target: str
    logo_type: str = Field(alias="logoType", default="combination")
    keywords: list[str] = Field(default_factory=list)
    avoid_colors: list[str] = Field(alias="avoidColors", default_factory=list)
    avoid_elements: list[str] = Field(alias="avoidElements", default_factory=list)
    preferred_style: str = Field(alias="preferredStyle", default="")
    additional_notes: str = Field(alias="additionalNotes", default="")

    model_config = {"populate_by_name": True}


class AnalyzeRequest(BaseModel):
    briefText: str = Field(max_length=5000)


class GeneratePromptsRequest(BaseModel):
    analysis: Analysis


class GeneratePromptsResponse(BaseModel):
    prompts: list[str]


class GenerateLogosRequest(BaseModel):
    prompts: list[str]


class GenerateLogosResponse(BaseModel):
    logos: list[str]


class GenerateProposalRequest(BaseModel):
    analysis: Analysis
    selectedPrompt: str


class GenerateProposalResponse(BaseModel):
    proposal: str


class RevisePromptRequest(BaseModel):
    originalPrompt: str
    revisionInstruction: str = Field(max_length=500)


class RevisePromptResponse(BaseModel):
    revisedPrompt: str


class FetchUrlRequest(BaseModel):
    url: str


class FetchUrlResponse(BaseModel):
    text: str
