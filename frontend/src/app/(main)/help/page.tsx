'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import {
  Star,
  ThumbsUp,
  MessageSquare,
  Send,
  History,
  HelpCircle,
  Sparkles,
  Rocket,
  CheckCircle,
  Lightbulb,
  BookOpen,
  MessageCircleHeart,
  ChevronRight,
  Calendar,
  Mail,
  Tag,
  FileText,
} from 'lucide-react'
import { feedbackApi, SatisfactionRating, Feedback, FeatureRequest } from '@/lib/api/feedback'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function HelpFeedbackPage() {
  const t = useTranslations()
  const [activeTab, setActiveTab] = useState<'help' | 'feedback'>('help')

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [existingRating, setExistingRating] = useState<SatisfactionRating | null>(null)
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug')
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackDescription, setFeedbackDescription] = useState('')
  const [feedbackContact, setFeedbackContact] = useState('')
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [satRes, fbRes, featRes] = await Promise.all([
        feedbackApi.getSatisfaction(),
        feedbackApi.getFeedbacks(),
        feedbackApi.getFeatures(),
      ])
      if (satRes.rating) {
        setExistingRating(satRes.rating)
        setRating(satRes.rating.rating)
        setComment(satRes.rating.comment || '')
      }
      setFeedbacks(fbRes.data)
      setFeatureRequests(featRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error(t('about.feedback.ratingFailed'))
      return
    }
    setLoading(true)
    try {
      await feedbackApi.submitSatisfaction(rating, comment)
      toast.success(t('about.feedback.ratingSuccess'))
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.ratingFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackTitle || !feedbackDescription) {
      toast.error(t('about.feedback.feedbackFailed'))
      return
    }
    setLoading(true)
    try {
      await feedbackApi.createFeedback({
        type: feedbackType,
        title: feedbackTitle,
        description: feedbackDescription,
        contact: feedbackContact,
      })
      toast.success(t('about.feedback.feedbackSuccess'))
      setFeedbackTitle('')
      setFeedbackDescription('')
      setFeedbackContact('')
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.feedbackFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (featureId: number, hasVoted: boolean) => {
    try {
      if (hasVoted) {
        await feedbackApi.unvoteFeature(featureId)
        toast.success(t('about.feedback.unvoteSuccess'))
      } else {
        await feedbackApi.voteFeature(featureId)
        toast.success(t('about.feedback.voteSuccess'))
      }
      loadData()
    } catch (error) {
      toast.error(t('about.feedback.voteFailed'))
    }
  }

  const getStatusBadge = (status: string) => {
    const statusKey = `about.feedback.status.${status}` as const
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      pending: 'secondary',
      in_progress: 'default',
      resolved: 'outline',
      closed: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{t(statusKey)}</Badge>
  }

  const getFeatureStatusBadge = (status: string) => {
    const statusKey = `about.feedback.featureStatus.${status}` as const
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      planned: 'secondary',
      in_progress: 'default',
      completed: 'outline',
    }
    return <Badge variant={variants[status] || 'secondary'}>{t(statusKey)}</Badge>
  }

  const features = [
    { key: 'multiModel', icon: Sparkles },
    { key: 'noteSave', icon: CheckCircle },
    { key: 'knowledgeBase', icon: Lightbulb },
    { key: 'export', icon: Rocket },
  ]

  const quickStartSteps = ['step1', 'step2', 'step3']
  const faqItems = ['q1', 'q2', 'q3', 'q4']

  return (
    <div className="flex flex-col h-full">
      {/* Header - matching account page */}
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20 sticky top-0 z-10 shrink-0 backdrop-blur-sm">
        <div className="flex items-center justify-center p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">{t('helpFeedback.title')}</h1>
          </div>
        </div>
      </div>

      {/* Tab Bar - styled segmented control */}
      <div className="border-b bg-background/80 backdrop-blur-sm shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
            <Button
              variant="ghost"
              onClick={() => setActiveTab('help')}
              className={`flex-1 rounded-lg transition-all duration-200 ${
                activeTab === 'help'
                  ? 'bg-background shadow-sm text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('helpFeedback.helpTab')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 rounded-lg transition-all duration-200 ${
                activeTab === 'feedback'
                  ? 'bg-background shadow-sm text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircleHeart className="h-4 w-4 mr-2" />
              {t('helpFeedback.feedbackTab')}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
          {activeTab === 'help' ? (
            <>
              {/* Overview Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <HelpCircle className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.help.overview')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="text-muted-foreground leading-relaxed">
                    {t('about.help.overviewContent')}
                  </p>
                </CardContent>
              </Card>

              {/* Features Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.help.features')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {features.map(({ key, icon: Icon }) => (
                      <div
                        key={key}
                        className="p-5 flex items-start gap-4 group hover:bg-muted/30 transition-colors duration-200"
                      >
                        <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">{t(`about.help.featuresList.${key}.title`)}</h4>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {t(`about.help.featuresList.${key}.desc`)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Start Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.help.quickStart')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {quickStartSteps.map((step, index) => (
                      <div
                        key={step}
                        className="p-5 flex items-center gap-4 group hover:bg-muted/30 transition-colors duration-200"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">
                          {t(`about.help.quickStartSteps.${step}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.help.faq')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {faqItems.map((item) => (
                      <div
                        key={item}
                        className="p-5 group hover:bg-muted/30 transition-colors duration-200"
                      >
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <span className="text-primary">Q:</span>
                          {t(`about.help.faqList.${item}.q`)}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed pl-5">
                          {t(`about.help.faqList.${item}.a`)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Satisfaction Rating Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">
                        {t('about.feedback.satisfaction')}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {t('about.feedback.satisfactionDesc')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 rounded-lg hover:bg-muted/50 transition-colors duration-200 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 transition-colors duration-200 ${
                            star <= rating
                              ? 'fill-yellow-400 text-yellow-400 dark:fill-yellow-500 dark:text-yellow-500'
                              : 'text-muted-foreground/40 hover:text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={t('about.feedback.satisfactionPlaceholder')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button onClick={handleRatingSubmit} disabled={loading || rating === 0}>
                    {existingRating ? t('about.feedback.updateRating') : t('about.feedback.submitRating')}
                  </Button>
                </CardContent>
              </Card>

              {/* Submit Feedback Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.feedback.submitFeedback')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('about.feedback.feedbackType')}</Label>
                    <RadioGroup
                      value={feedbackType}
                      onValueChange={(v) => setFeedbackType(v as 'bug' | 'feature' | 'other')}
                      className="flex gap-4"
                    >
                      {(['bug', 'feature', 'other'] as const).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={type} />
                          <Label htmlFor={type} className="text-sm cursor-pointer">
                            {t(`about.feedback.${type === 'bug' ? 'bugReport' : type === 'feature' ? 'featureSuggestion' : 'other'}`)}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      {t('about.feedback.title_placeholder')}
                    </Label>
                    <Input
                      id="title"
                      value={feedbackTitle}
                      onChange={(e) => setFeedbackTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      {t('about.feedback.description_placeholder')}
                    </Label>
                    <Textarea
                      id="description"
                      value={feedbackDescription}
                      onChange={(e) => setFeedbackDescription(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact" className="text-sm font-medium">
                      {t('about.feedback.contact_placeholder')}
                    </Label>
                    <Input
                      id="contact"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleFeedbackSubmit} disabled={loading}>
                    <Send className="h-4 w-4 mr-2" />
                    {t('about.feedback.submit')}
                  </Button>
                </CardContent>
              </Card>

              {/* Feedback History Card */}
              {feedbacks.length > 0 && (
                <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                  <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                        <History className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg font-semibold">
                        {t('about.feedback.feedbackHistory')}
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({feedbacks.length})
                        </span>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {feedbacks.map((fb) => (
                        <div
                          key={fb.id}
                          className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200 cursor-pointer active:scale-[0.99]"
                          onClick={() => setSelectedFeedback(fb)}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
                              <MessageSquare className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{fb.title}</span>
                                {getStatusBadge(fb.status)}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {fb.description}
                              </p>
                              <p className="text-xs text-muted-foreground/60 mt-0.5">
                                {new Date(fb.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Feedback Detail Dialog */}
              <Dialog
                open={!!selectedFeedback}
                onOpenChange={(open) => !open && setSelectedFeedback(null)}
              >
                <DialogContent className="sm:max-w-lg">
                  {selectedFeedback && (
                    <>
                      <DialogHeader>
                        <div className="flex items-center gap-3 pr-6">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <DialogTitle className="truncate text-base">
                              {selectedFeedback.title}
                            </DialogTitle>
                            <DialogDescription className="mt-0.5">
                              #{selectedFeedback.id}
                            </DialogDescription>
                          </div>
                        </div>
                      </DialogHeader>

                      <div className="space-y-4 pt-1">
                        {/* Status & Type Row */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(selectedFeedback.status)}
                          </div>
                          <div className="h-4 w-px bg-border" />
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Tag className="h-3.5 w-3.5" />
                            {selectedFeedback.type === 'bug'
                              ? t('about.feedback.bugReport')
                              : selectedFeedback.type === 'feature'
                                ? t('about.feedback.featureSuggestion')
                                : t('about.feedback.other')}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t" />

                        {/* Description */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {t('about.feedback.detailDescription')}
                          </label>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {selectedFeedback.description}
                          </p>
                        </div>

                        {/* Contact */}
                        {selectedFeedback.contact && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {t('about.feedback.contactLabel')}: {selectedFeedback.contact}
                            </span>
                          </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {t('about.feedback.detailCreatedAt')}{' '}
                              {new Date(selectedFeedback.created_at).toLocaleString()}
                            </span>
                          </div>
                          {selectedFeedback.updated_at !== selectedFeedback.created_at && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                {t('about.feedback.detailUpdatedAt')}{' '}
                                {new Date(selectedFeedback.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>

              {/* Feature Voting Card */}
              <Card className="w-full overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/10 dark:from-card dark:via-card dark:to-muted/5 transition-all duration-300 hover:shadow-xl">
                <CardHeader className="pb-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                      <ThumbsUp className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg font-semibold">
                      {t('about.feedback.featureVoting')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {featureRequests.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
                      <ThumbsUp className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm">{t('about.feedback.noFeatures')}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {featureRequests.map((feature) => (
                        <div
                          key={feature.id}
                          className="p-5 flex items-center justify-between gap-4 group hover:bg-muted/30 transition-colors duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{feature.title}</span>
                              {getFeatureStatusBadge(feature.status)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {feature.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {feature.vote_count} {t('about.feedback.votes')}
                            </span>
                            <Button
                              variant={feature.has_voted ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleVote(feature.id, feature.has_voted)}
                              className="transition-all duration-200"
                            >
                              <ThumbsUp
                                className={`h-3.5 w-3.5 mr-1 ${feature.has_voted ? 'fill-current' : ''}`}
                              />
                              {feature.has_voted ? t('about.feedback.unvote') : t('about.feedback.vote')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
